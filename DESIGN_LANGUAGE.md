# CineGraph Design Language — "PROJECTION"

> Light through darkness. Every screen is a theater: warm black rooms, one beam of golden light, and the posters are the stars.

This is the single source of truth for the redesign. Stack: React 19 + Vite + **Tailwind v4** (CSS-first `@theme` — no `tailwind.config.js`), Framer Motion, Lenis, GSAP (Year in Review only).

---

## 1. Concept

CineGraph is the feeling of being in the seat as the lights go down. The UI is a dark auditorium — **warm** near-blacks, never cold slate — and attention is directed the way a projector directs light: one golden accent, used sparingly, so that when something glows, it *means* something.

Three rules everything obeys:
1. **Posters are the light source.** UI recedes; imagery projects.
2. **Tungsten acts, Daylight navigates.** Two accents, strict jobs. If everything glows, nothing does.
3. **Motion is projection.** Things fade up from dark and settle like a reel stopping — no bouncing, no cartoon springs.

Approved decisions: Bricolage Grotesque display · electric Tungsten/Daylight duo · R3F 3D poster wall on the landing hero.

---

## 2. Typography

**Display / brand voice: Bricolage Grotesque** (variable)
Quirky ink-trap details give it editorial personality — film-magazine, not tech-startup — while staying instantly legible. Distinctive enough to *be* the brand; Clash Display is skipped because it's the default "cool portfolio" font of the last two years.

**Body / UI: Instrument Sans** (variable)
Clean grotesque with slightly warm, drawn curves. Calm next to Bricolage's personality. Great at small sizes.

**Metadata / data accent: Spline Sans Mono** (variable)
The signature move: all *film data* — years, runtimes, ratings, counts, dates — set in mono, uppercase, letterspaced. Reads like a production slate / camera report. Instantly "cinema" without a single image.

```bash
npm i @fontsource-variable/bricolage-grotesque @fontsource-variable/instrument-sans @fontsource-variable/spline-sans-mono
```

```ts
// main.tsx
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/spline-sans-mono';
```

### Type scale (fluid)

| Token | Spec | Use |
|---|---|---|
| `display-xl` | Bricolage 700, `clamp(2.75rem, 6vw, 5.5rem)`, lh 1.02, ls -0.02em | Landing hero only |
| `display` | Bricolage 700, `clamp(2rem, 4vw, 3.25rem)`, lh 1.05, ls -0.015em | Page heroes (movie title) |
| `h1` | Bricolage 600, 2rem | Page titles |
| `h2` | Bricolage 600, 1.375rem | Section headers |
| `h3` | Instrument 600, 1.125rem | Card/sub headers |
| `body` | Instrument 400, 1rem, lh 1.65 | Copy, reviews |
| `small` | Instrument 400, 0.875rem | Secondary copy |
| `meta` | Spline Mono 500, 0.75rem, **uppercase, ls +0.08em** | Years, runtimes, ratings, labels — the slate style |

---

## 3. Color — "Tungsten & Daylight"

Philosophy: **the orange & teal of a movie color grade, on a dark neutral room.** In film lighting, *tungsten* (~3200K, warm) and *daylight* (~5600K, cool) are the two white-balance standards — and orange/teal is the most famous grading duo in modern cinema. That's our electric pair, named in film language.

**The usage law — act vs. navigate:**
- **Tungsten (electric coral-orange)** = *action & commitment*: primary CTAs, star ratings, logging, record-dot, earned states. It's the REC light.
- **Daylight (electric teal-cyan)** = *wayfinding & information*: links, active nav, search focus, secondary data series, social accents.
- Never both at full strength in one component. Full duo moments (gradients, split lighting) are reserved for brand heroes: Landing, Year in Review, platinum achievements.

### Tailwind v4 tokens (drop into `index.css` `@theme`)

```css
@theme {
  /* ---- Surfaces: the dark neutral room ---- */
  --color-void: #0B0A0A;          /* page background */
  --color-surface: #131212;       /* cards, nav */
  --color-surface-2: #1C1A19;     /* raised: modals, hover */
  --color-surface-3: #262322;     /* highest: popovers, inputs */

  /* legacy aliases so existing classes keep working during migration */
  --color-background: #0B0A0A;
  --color-surface-light: #1C1A19;

  /* ---- Lines ---- */
  --color-line: rgb(244 241 236 / 0.08);
  --color-line-strong: rgb(244 241 236 / 0.16);

  /* ---- Text: projected light ---- */
  --color-ink: #F4F1EC;           /* primary — warm projector white */
  --color-ink-mute: #A8A29A;      /* secondary */
  --color-ink-faint: #6F6A63;     /* tertiary / disabled */

  /* ---- TUNGSTEN: act (electric coral-orange) ---- */
  --color-tungsten-300: #FFA07A;
  --color-tungsten-400: #FF7847;  /* primary accent */
  --color-tungsten-500: #F55E28;  /* hover / active */
  --color-tungsten-600: #D0481A;  /* pressed */
  --color-primary: #FF7847;       /* re-points ALL existing bg/text-primary */

  /* ---- DAYLIGHT: navigate (electric teal-cyan) ---- */
  --color-daylight-300: #7DF0DF;
  --color-daylight-400: #2DD9C6;  /* secondary accent */
  --color-daylight-500: #17B3A3;  /* hover / active */
  --color-daylight-600: #0E8A7E;  /* pressed */

  /* ---- Functional ---- */
  --color-danger: #E5484D;
  --color-success: #6FBF73;

  /* ---- Ambient (poster-extracted, set per movie page via JS) ---- */
  --color-ambient: #1C1A19;       /* fallback = surface-2 */

  /* ---- Fonts ---- */
  --font-display: 'Bricolage Grotesque Variable', system-ui, sans-serif;
  --font-sans: 'Instrument Sans Variable', system-ui, sans-serif;
  --font-mono: 'Spline Sans Mono Variable', ui-monospace, monospace;

  /* ---- Radii ---- */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-poster: 10px;          /* every poster, everywhere, always */

  /* ---- Shadows & glow ---- */
  --shadow-card: 0 2px 8px rgb(0 0 0 / 0.45), 0 12px 32px rgb(0 0 0 / 0.35);
  --shadow-lift: 0 4px 16px rgb(0 0 0 / 0.5), 0 24px 48px rgb(0 0 0 / 0.45);
  --shadow-glow: 0 0 0 1px rgb(255 120 71 / 0.35), 0 4px 24px rgb(255 120 71 / 0.18);
  --shadow-glow-cool: 0 0 0 1px rgb(45 217 198 / 0.3), 0 4px 24px rgb(45 217 198 / 0.15);

  /* ---- Motion ---- */
  --ease-reel: cubic-bezier(0.22, 1, 0.36, 1);  /* "reel stop": fast in, soft settle */
  --duration-micro: 150ms;
  --duration-standard: 300ms;
  --duration-scene: 600ms;
}
```

**Why this works with zero component edits first:** `--color-primary` re-points every existing `bg-primary`/`text-primary` from Netflix red to tungsten, and defining `--color-background`/`--color-surface` (currently commented out!) fixes the classes that silently don't render today. The app re-themes the moment the tokens land.

**Poster ambient color:** on Movie Detail, sample the poster (tiny canvas downscale → average hue, clamped to tasteful lightness) and set `--color-ambient` on the page root. Backdrop gradient + log-button glow tint to each film. The theater lights change with the movie. (Ships in the Movie Detail phase.)

---

## 4. Space, radius, elevation

- **4px grid.** Section rhythm: 96px between page sections desktop / 64px mobile. Generous negative space *is* the minimalism half of the brief.
- **Radii:** interactive chrome `md`, cards `lg`, modals `xl`, posters always `--radius-poster`.
- **Elevation = lighter surface + deeper shadow** (stage depth), never borders alone. Gold `--shadow-glow` is reserved for: primary CTA hover, focused inputs, "earned achievement" states.
- **Max content width:** 1280px (existing `max-w-7xl` stays).

---

## 5. Motion — "projection"

| Tier | Duration | Use |
|---|---|---|
| micro | 150ms | hovers, toggles, star fills |
| standard | 300ms | cards, modals, dropdowns |
| scene | 600ms | page transitions, hero reveals |

- **One easing:** `--ease-reel` — `cubic-bezier(0.22, 1, 0.36, 1)`. Nothing bounces.
- **Entrances:** fade + rise 8px + scale from 0.985. Light leads: glow/opacity changes precede movement by a frame.
- **Shared elements:** Framer Motion `layoutId` on poster → movie-detail hero. The poster you click *becomes* the page.
- **Scroll:** Lenis globally (subtle: `lerp: 0.12`). GSAP + ScrollTrigger only inside Year in Review.
- **Stagger:** grids reveal at 40ms/item, capped at 8 items — then instant.
- **Reduced motion:** `prefers-reduced-motion` kills transforms/parallax/grain animation and Lenis; opacity-only fallbacks. Non-negotiable.

---

## 6. Cinematic motifs — the chosen three

1. **Film grain** — fixed full-viewport SVG-noise overlay at ~3.5% opacity. Invisible until you look; makes every gradient feel like celluloid, kills banding for free.
2. **The slate** — `meta` mono style + section headers formatted like a clapperboard: `SC 01 · NOW SHOWING`, gold tick, tracked uppercase. This replaces generic "Popular Movies" labels and becomes CineGraph's most recognizable pattern.
3. **Split lighting** — tungsten glow on actions, daylight glow on wayfinding; the full duo (orange-teal gradient light) only on brand heroes (landing poster wall, Year in Review).

**Deliberately rejected:** filmstrip perforation borders (clip-art kitsch), heavy vignettes (muddy posters), letterbox bars on content pages (wastes mobile viewport — reserved for the landing hero only).

---

## 7. Global CSS additions (after `@theme`)

```css
/* Base */
body {
  background-color: var(--color-void);
  color: var(--color-ink);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}

h1, h2 { font-family: var(--font-display); }

/* The slate — metadata style */
.meta {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-ink-mute);
}

/* Film grain overlay */
body::after {
  content: "";
  position: fixed;
  inset: -50%;
  z-index: 9999;
  pointer-events: none;
  opacity: 0.035;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  animation: grain 8s steps(10) infinite;
}
@keyframes grain {
  0%, 100% { transform: translate(0, 0); }
  20% { transform: translate(-2%, 2%); }
  40% { transform: translate(2%, -1%); }
  60% { transform: translate(-1%, 1%); }
  80% { transform: translate(1%, -2%); }
}
@media (prefers-reduced-motion: reduce) {
  body::after { animation: none; }
}

/* Focus visible — daylight beam (wayfinding) */
:focus-visible {
  outline: 2px solid var(--color-daylight-400);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* Selection */
::selection { background: rgb(255 120 71 / 0.3); }
```

---

## 8. Library installs (full redesign)

```bash
npm i @fontsource-variable/bricolage-grotesque @fontsource-variable/instrument-sans @fontsource-variable/spline-sans-mono
npm i framer-motion lenis
npm i gsap            # Year in Review phase only
# React Three Fiber — decided at Landing phase; only if the poster-wall concept is chosen
```

## 9. Rollout order

1. **Tokens + global CSS + fonts** → whole app re-themes instantly (gold replaces red, warm blacks replace slate, broken `bg-surface`/`bg-background` classes start working).
2. **Component kit**: Navbar, MovieCard, Button, StarRating, SearchBar, badges, skeletons.
3. **Pages**: Landing → Movie Detail → For You → Analytics/Year in Review → the rest.
