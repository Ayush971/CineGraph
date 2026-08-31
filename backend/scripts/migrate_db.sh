#!/usr/bin/env bash
#
# CineGraph — PostgreSQL migration / backup tool
#
# Copies a Postgres database from SOURCE to TARGET and verifies the move by
# comparing exact row counts table-by-table. Also usable as a plain backup tool.
#
# Runs pg_dump/psql inside a Docker container, so no local PostgreSQL install is
# needed — only Docker Desktop running. The client image is deliberately NEWER
# than any server we talk to: pg_dump refuses to dump from a server newer than
# itself, but dumping from an older server is always fine.
#
# ---------------------------------------------------------------------------
# USAGE
#
#   Full migration (dump SOURCE, restore into TARGET, verify):
#     SOURCE_URL="postgresql://..." TARGET_URL="postgresql://..." ./migrate_db.sh
#
#   Backup only (no target needed) — writes a timestamped .sql file:
#     SOURCE_URL="postgresql://..." ./migrate_db.sh --dump-only
#
#   Re-verify two databases already migrated:
#     SOURCE_URL="..." TARGET_URL="..." ./migrate_db.sh --verify-only
#
#   Restore an existing dump file into TARGET:
#     TARGET_URL="..." ./migrate_db.sh --restore backups/cinegraph_2026-08-30.sql
#
# Add --force to write into a TARGET that already has tables (default: refuse).
#
# WHERE TO GET THE URLS
#   SOURCE_URL  Render dashboard -> cinegraph-db -> "External Database URL"
#   TARGET_URL  Neon dashboard   -> your project -> connection string
#               (Neon requires SSL; keep the ?sslmode=require suffix)
# ---------------------------------------------------------------------------

set -euo pipefail

PG_IMAGE="${PG_IMAGE:-postgres:17-alpine}"
BACKUP_DIR="${BACKUP_DIR:-backups}"
MODE="migrate"
FORCE=0
RESTORE_FILE=""

# ---------- args ----------
while [ $# -gt 0 ]; do
  case "$1" in
    --dump-only)   MODE="dump" ;;
    --verify-only) MODE="verify" ;;
    --restore)     MODE="restore"; RESTORE_FILE="${2:-}"; shift ;;
    --force)       FORCE=1 ;;
    -h|--help)     sed -n '2,40p' "$0"; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done

# ---------- pretty output ----------
if [ -t 1 ]; then
  B=$'\033[1m'; DIM=$'\033[2m'; R=$'\033[31m'; G=$'\033[32m'; Y=$'\033[33m'; N=$'\033[0m'
else
  B=""; DIM=""; R=""; G=""; Y=""; N=""
fi
step() { echo "${B}==>${N} $*"; }
ok()   { echo "  ${G}OK${N}  $*"; }
warn() { echo "  ${Y}!!${N}  $*"; }
die()  { echo "${R}ERROR:${N} $*" >&2; exit 1; }

# ---------- docker helpers ----------
# psql_q <url> <sql>  ->  rows, pipe-separated, no headers
psql_q() {
  docker run --rm -i "$PG_IMAGE" \
    psql "$1" -v ON_ERROR_STOP=1 -t -A -F'|' -c "$2"
}

# Exact per-table row counts. pg_stat_user_tables is only an ESTIMATE, so this
# runs a real COUNT(*) on every table via query_to_xml in a single round trip.
COUNT_SQL="
SELECT table_name,
       (xpath('/row/cnt/text()', xml_count))[1]::text::bigint AS rows
FROM (
  SELECT table_name,
         query_to_xml(format('SELECT COUNT(*) AS cnt FROM %I.%I', table_schema, table_name),
                      false, true, '') AS xml_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
) t
ORDER BY table_name;"

server_version() { psql_q "$1" "SHOW server_version;" | tr -d ' '; }
table_count()    { psql_q "$1" "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';" | tr -d ' '; }

# ---------- preflight ----------
step "Preflight"

# Query the SERVER version specifically — `docker info` can exit 0 while the
# daemon is unreachable, so it is not a trustworthy liveness check.
DOCKER_SERVER="$(docker version --format '{{.Server.Version}}' 2>/dev/null || true)"
[ -n "$DOCKER_SERVER" ] || die "Docker daemon is not running. Start Docker Desktop and retry."
ok "Docker daemon running (server $DOCKER_SERVER)"

if [ "$MODE" != "restore" ]; then
  [ -n "${SOURCE_URL:-}" ] || die "SOURCE_URL is not set. See --help."
fi
if [ "$MODE" = "migrate" ] || [ "$MODE" = "verify" ] || [ "$MODE" = "restore" ]; then
  [ -n "${TARGET_URL:-}" ] || die "TARGET_URL is not set. See --help."
fi

if ! docker image inspect "$PG_IMAGE" >/dev/null 2>&1; then
  step "Pulling $PG_IMAGE (one time)"
  docker pull "$PG_IMAGE" >/dev/null
fi
ok "Client image $PG_IMAGE ready"

if [ "$MODE" != "restore" ]; then
  SRC_V="$(server_version "$SOURCE_URL")" || die "Cannot connect to SOURCE. Check the URL and that the database is awake."
  SRC_T="$(table_count "$SOURCE_URL")"
  ok "Source reachable — Postgres $SRC_V, $SRC_T tables"
  [ "$SRC_T" -gt 0 ] || die "Source has no tables in schema 'public'. Nothing to migrate."
fi

if [ -n "${TARGET_URL:-}" ]; then
  TGT_V="$(server_version "$TARGET_URL")" || die "Cannot connect to TARGET. Check the URL (Neon needs ?sslmode=require)."
  TGT_T="$(table_count "$TARGET_URL")"
  ok "Target reachable — Postgres $TGT_V, $TGT_T tables"

  if [ "$MODE" = "migrate" ] || [ "$MODE" = "restore" ]; then
    if [ "$TGT_T" -gt 0 ] && [ "$FORCE" -eq 0 ]; then
      die "Target already has $TGT_T tables. Refusing to write into a non-empty database.
       Re-run with --force only if you are certain you want to merge/overwrite."
    fi
    [ "$TGT_T" -gt 0 ] && warn "Target is not empty and --force was given; existing objects may conflict."
  fi
fi

# ---------- dump ----------
mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y-%m-%d_%H%M%S)"
DUMP_FILE="$BACKUP_DIR/cinegraph_${STAMP}.sql"

if [ "$MODE" = "dump" ] || [ "$MODE" = "migrate" ]; then
  step "Dumping source -> $DUMP_FILE"
  # --no-owner / --no-acl: roles differ between hosts, so ownership and grants
  #   from Render would fail to apply on Neon. The data is what matters.
  # --no-comments keeps the file lean; schema comments carry nothing we need.
  docker run --rm -i "$PG_IMAGE" \
    pg_dump "$SOURCE_URL" \
      --no-owner --no-acl --no-comments \
      --format=plain \
    > "$DUMP_FILE"

  if [ ! -s "$DUMP_FILE" ]; then
    rm -f "$DUMP_FILE"
    die "Dump produced an empty file — aborting."
  fi
  SIZE="$(du -h "$DUMP_FILE" | cut -f1)"
  ok "Dump written ($SIZE) — keep this file, it is a full backup"
fi

if [ "$MODE" = "dump" ]; then
  echo
  echo "${B}Backup complete.${N} $DUMP_FILE"
  exit 0
fi

# ---------- restore ----------
if [ "$MODE" = "restore" ]; then
  [ -n "$RESTORE_FILE" ] || die "--restore needs a file path."
  [ -f "$RESTORE_FILE" ] || die "File not found: $RESTORE_FILE"
  DUMP_FILE="$RESTORE_FILE"
fi

if [ "$MODE" = "migrate" ] || [ "$MODE" = "restore" ]; then
  step "Restoring into target"
  # ON_ERROR_STOP makes psql fail loudly instead of limping through a half
  # restore and leaving a silently incomplete database.
  # stdout is discarded (a restore emits a result table for every setval and
  # similar statement); stderr is kept so real problems still surface.
  if ! docker run --rm -i "$PG_IMAGE" \
        psql "$TARGET_URL" -v ON_ERROR_STOP=1 --quiet -o /dev/null < "$DUMP_FILE"; then
    die "Restore failed. The dump is intact at $DUMP_FILE — nothing was lost on the source."
  fi
  ok "Restore finished"
fi

# ---------- verify ----------
step "Verifying row counts"

SRC_COUNTS="$(psql_q "$SOURCE_URL" "$COUNT_SQL")"
TGT_COUNTS="$(psql_q "$TARGET_URL" "$COUNT_SQL")"

printf "\n  %-22s %12s %12s   %s\n" "TABLE" "SOURCE" "TARGET" "STATUS"
printf "  %-22s %12s %12s   %s\n" "----------------------" "------------" "------------" "------"

MISMATCH=0
TOTAL_SRC=0
while IFS='|' read -r tbl src; do
  [ -n "$tbl" ] || continue
  tgt="$(printf '%s\n' "$TGT_COUNTS" | awk -F'|' -v t="$tbl" '$1==t {print $2}')"
  [ -n "$tgt" ] || tgt="MISSING"
  TOTAL_SRC=$(( TOTAL_SRC + src ))
  if [ "$src" = "$tgt" ]; then
    printf "  %-22s %12s %12s   ${G}%s${N}\n" "$tbl" "$src" "$tgt" "match"
  else
    printf "  %-22s %12s %12s   ${R}%s${N}\n" "$tbl" "$src" "$tgt" "MISMATCH"
    MISMATCH=1
  fi
done <<< "$SRC_COUNTS"

echo
if [ "$MISMATCH" -eq 0 ]; then
  echo "${G}${B}Verified.${N} All tables match — $TOTAL_SRC rows total."
  echo
  echo "${B}Next steps${N}"
  echo "  1. Set DATABASE_URL on Render to the Neon connection string."
  echo "  2. Redeploy, then check /health reports database: connected."
  echo "  3. Exercise the live site (log in, log a film) before deleting anything."
  if [ -f "$DUMP_FILE" ]; then
    echo "  ${DIM}Keep $DUMP_FILE until you are confident. Do not delete the old database yet.${N}"
  fi
  exit 0
else
  echo "${R}${B}Verification FAILED.${N} At least one table does not match."
  echo "  The source database was not modified. Investigate before switching DATABASE_URL."
  exit 1
fi
