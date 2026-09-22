import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { peopleAPI } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import Badge from "../components/ui/Badge";
import type { PersonDetail, PersonCredit } from "../types";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

const formatDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

/** Age at death if they've died, otherwise current age. */
const ageFrom = (birthday?: string, deathday?: string): number | null => {
  if (!birthday) return null;
  const born = new Date(birthday);
  const end = deathday ? new Date(deathday) : new Date();
  let age = end.getFullYear() - born.getFullYear();
  const m = end.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && end.getDate() < born.getDate())) age--;
  return age;
};

const CreditCard: React.FC<{ credit: PersonCredit }> = ({ credit }) => {
  const poster = credit.poster_path
    ? `${TMDB_IMAGE_BASE}/w342${credit.poster_path}`
    : null;
  const year = credit.release_date
    ? new Date(credit.release_date).getFullYear()
    : "TBA";

  return (
    <Link to={`/movie/${credit.tmdb_id}`} className="group block">
      <div className="relative overflow-hidden rounded-[10px] bg-surface-2 ring-1 ring-line group-hover:ring-tungsten-400/40 shadow-[var(--shadow-card)] group-hover:shadow-[var(--shadow-lift)] transition-[box-shadow] duration-300">
        {poster ? (
          <img
            src={poster}
            alt={credit.title}
            className="w-full aspect-[2/3] object-cover group-hover:scale-[1.03] transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full aspect-[2/3] flex items-center justify-center">
            <span className="meta !text-ink-faint">No poster</span>
          </div>
        )}
        {credit.vote_average ? (
          <span className="absolute top-2 right-2 meta !text-tungsten-300 bg-void/75 px-2 py-1 rounded-md">
            ★ {credit.vote_average.toFixed(1)}
          </span>
        ) : null}
      </div>
      <div className="mt-2.5 px-0.5">
        <h3 className="text-ink font-medium text-sm leading-snug line-clamp-2 group-hover:text-tungsten-300 transition-colors duration-150">
          {credit.title}
        </h3>
        <p className="meta mt-1 !text-ink-faint">{year}</p>
        {credit.role && (
          <p className="text-xs text-daylight-300/90 mt-1 line-clamp-1">
            {credit.role}
          </p>
        )}
      </div>
    </Link>
  );
};

const PersonPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [person, setPerson] = useState<PersonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bioExpanded, setBioExpanded] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setBioExpanded(false);
    peopleAPI
      .getDetail(Number(id))
      .then((res) => {
        if (!cancelled) setPerson(res.data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load this person");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <LoadingSpinner />;

  if (error || !person) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-3">
        <p className="meta !text-danger">Not in the Credits</p>
        <p className="text-ink-mute text-lg">{error || "Person not found"}</p>
      </div>
    );
  }

  const photo = person.profile_path
    ? `${TMDB_IMAGE_BASE}/h632${person.profile_path}`
    : null;
  const age = ageFrom(person.birthday, person.deathday);
  const bio = person.biography?.trim();
  const bioIsLong = (bio?.length ?? 0) > 700;

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
      <div className="flex flex-col md:flex-row gap-10">
        {/* ---- Portrait + facts ---- */}
        <div className="shrink-0 w-56 mx-auto md:w-64 md:mx-0">
          <div className="relative">
            <div
              className="absolute -inset-4 rounded-[24px] blur-2xl opacity-40 bg-surface-3"
              aria-hidden="true"
            />
            {photo ? (
              <img
                src={photo}
                alt={person.name}
                className="relative w-full rounded-[10px] shadow-[var(--shadow-lift)] ring-1 ring-line-strong"
              />
            ) : (
              <div className="relative w-full aspect-[2/3] rounded-[10px] bg-surface-2 ring-1 ring-line flex items-center justify-center">
                <span className="font-display text-5xl text-ink-faint">
                  {person.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          <dl className="mt-7 flex flex-col gap-4">
            {person.known_for_department && (
              <div>
                <dt className="meta mb-1">Known For</dt>
                <dd className="text-sm text-ink">
                  {person.known_for_department}
                </dd>
              </div>
            )}
            {person.birthday && (
              <div>
                <dt className="meta mb-1">Born</dt>
                <dd className="text-sm text-ink">
                  {formatDate(person.birthday)}
                  {age !== null && !person.deathday && (
                    <span className="text-ink-mute"> · age {age}</span>
                  )}
                </dd>
              </div>
            )}
            {person.deathday && (
              <div>
                <dt className="meta mb-1">Died</dt>
                <dd className="text-sm text-ink">
                  {formatDate(person.deathday)}
                  {age !== null && (
                    <span className="text-ink-mute"> · aged {age}</span>
                  )}
                </dd>
              </div>
            )}
            {person.place_of_birth && (
              <div>
                <dt className="meta mb-1">From</dt>
                <dd className="text-sm text-ink">{person.place_of_birth}</dd>
              </div>
            )}
            <div>
              <dt className="meta mb-1">Credits</dt>
              <dd className="text-sm text-ink">{person.total_credits} films</dd>
            </div>
            {person.also_known_as.length > 0 && (
              <div>
                <dt className="meta mb-2">Also Known As</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {person.also_known_as.slice(0, 4).map((alias) => (
                    <Badge key={alias} variant="genre">
                      {alias}
                    </Badge>
                  ))}
                </dd>
              </div>
            )}
            {person.imdb_id && (
              <div>
                <a
                  href={`https://www.imdb.com/name/${person.imdb_id}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="meta !text-daylight-300 hover:!text-daylight-400 transition-colors"
                >
                  IMDb ↗
                </a>
              </div>
            )}
          </dl>
        </div>

        {/* ---- Name + biography ---- */}
        <div className="flex-1 min-w-0">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="meta !text-tungsten-300 mb-3"
          >
            Profile
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="font-display font-bold text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] tracking-[-0.015em] mb-6"
          >
            {person.name}
          </motion.h1>

          {bio ? (
            <div className="mb-10">
              <p className="meta mb-2">Biography</p>
              <p
                className={`text-ink-mute text-lg leading-relaxed max-w-3xl whitespace-pre-line ${
                  !bioExpanded && bioIsLong ? "line-clamp-6" : ""
                }`}
              >
                {bio}
              </p>
              {bioIsLong && (
                <button
                  onClick={() => setBioExpanded((v) => !v)}
                  className="meta !text-daylight-300 hover:!text-daylight-400 mt-3 transition-colors cursor-pointer"
                >
                  {bioExpanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          ) : (
            <p className="text-ink-faint mb-10">
              No biography available for {person.name} yet.
            </p>
          )}
        </div>
      </div>

      {/* ---- Filmography ---- */}
      {person.credit_groups.map((group, gi) => (
        <section key={group.label} className="mt-14">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <p className="meta !text-tungsten-300 mb-1.5">
                {gi === 0 ? "Filmography" : "Also"}
              </p>
              <h2 className="font-display font-semibold text-2xl">
                {group.label}
              </h2>
            </div>
            <span className="meta">{group.credits.length} films</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-5 gap-y-8">
            {group.credits.map((credit) => (
              <CreditCard
                key={`${group.label}-${credit.tmdb_id}`}
                credit={credit}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default PersonPage;
