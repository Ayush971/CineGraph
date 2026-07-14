# CineGraph — UI/UX Design Brief (prompt for Fable 5)

You are a senior product designer + front-end engineer. Redesign the UI of **CineGraph**, a movie-tracking and social platform, into something modern, cinematic, and memorable. Deliver a cohesive design system AND working front-end code in the existing stack — not abstract mockups.

## The product
CineGraph is a Letterboxd-style app where users browse movies (TMDB data), log them in a diary with 0–10 ratings and reviews, build ranked lists, follow people, comment, earn achievements, view analytics + a Spotify-Wrapped-style "Year in Review", and get personalized "For You" recommendations.

Existing pages to redesign (routes already exist — reskin, don't rebuild logic):
- Landing (logged-out hero), Movies home, Movie detail, Search, Diary, Lists + List detail + Discover, Activity Feed, User Profile, Achievements, Analytics, Year in Review, Recommendations ("For You"), Login/Register.
- Core components: Navbar, MovieCard, StarRating, SearchBar, modals (diary log, create list), comment threads.

## Positioning (this is the whole point)
- Direct competitors: **Letterboxd** and **moctale.in**. Letterboxd is clean but very minimalist/static. moctale is modern and cinematic.
- Land **between minimalist and highly interactive**: a restrained, elegant base with a handful of signature "wow" moments that make people want to stay and explore. Not busy everywhere — earn the flourishes.
- It must feel unmistakably about **movies/cinema**, and it must feel like *ours*, not a Letterboxd clone.

## Tech constraints (hard requirements)
- Stack is **React 18 + Vite + TypeScript + TailwindCSS**. All output must be implementable here.
- Deliver Tailwind theme tokens (`tailwind.config` extension: colors, fonts, spacing, shadows, radii) + component code in `.tsx`.
- Dark-first (the app is already dark). A light mode is optional/secondary.
- Motion library: **Framer Motion** (primary). **Lenis** for smooth scroll. **GSAP + ScrollTrigger** allowed for scroll-driven scenes. **React Three Fiber / Three.js** allowed for ONE or two hero 3D moments only — must be lazy-loaded, code-split, and gracefully degrade. No heavy 3D on content-dense pages.
- Everything must respect `prefers-reduced-motion`, be fully responsive (mobile → desktop), keyboard-accessible, and performant (lazy images, code-splitting, no jank). Posters are the hero content — never let effects fight legibility.

## Creative direction

**Identity / vibe:** cinematic, editorial, a little bit "premium streaming service meets film magazine." Confident and warm, not cold-corporate. Think projector light, film grain, marquee signage, the golden-hour glow of a cinema.

**Typography — give it a signature.** Pick ONE distinctive-but-legible display face for headings that becomes the brand's voice, paired with a clean workhorse for body. Strong candidates (all free, self-hostable):
- Display/signature: `Clash Display`, `Zodiak`, `Bricolage Grotesque`, `Instrument Serif` (high-contrast editorial), or `Unbounded` (quirky, very recognizable).
- Body/UI: `Satoshi`, `General Sans`, `Inter`, or `Geist`.
Recommend a pairing and justify it. Use big, expressive display type for hero/section headers; keep UI text calm. Establish a clear type scale.

**Color — move off Letterboxd's palette.** Base of deep cinematic near-blacks/charcoals with real depth (layered surfaces, subtle warm or cool tint — not flat #000). Choose ONE signature accent that reads as "cinema" (e.g. warm amber/gold "golden hour", or a bold electric duo) and use it with restraint for emphasis, focus states, and key CTAs. Define full token ramps + semantic tokens (background, surface, surface-elevated, border, text-primary/muted, accent, success/danger). Consider extracting ambient color from a movie's poster to tint its detail page.

**Cinematic motifs (use tastefully, pick a few — don't use all):** subtle film-grain/noise overlay, letterbox bars as a framing device, filmstrip-perforation dividers, projector/spotlight glow, marquee ticker for trending, vignettes, a soft "now showing" signage feel. These are seasoning, not the meal.

**Motion & micro-interactions:**
- Buttery page transitions and shared-element transitions (a MovieCard poster morphs into the detail-page hero via Framer Motion `layoutId`).
- MovieCard hover: refined tilt/scale + glow + a quiet reveal of rating/year/actions. Make the grid feel alive without being noisy.
- Scroll-driven reveals and parallax backdrops (Lenis + GSAP) on landing and movie detail.
- Animated number counters on stats/analytics; premium skeleton loaders; magnetic/primary buttons; a subtle custom cursor accent (optional, desktop only, reduced-motion aware).

**Signature "wow" moments (design these deliberately):**
1. **Landing hero** — a cinematic first impression: a 3D/parallax poster wall or a projector-beam scene, with the signature type and a clear CTA. This is the make-or-break screen.
2. **Movie detail** — parallax backdrop, poster-driven ambient color, shared-element entrance, and a tactile "Log / Rate" interaction.
3. **Year in Review** — full scrollytelling experience (it's already Wrapped-style data): animated, sequential, shareable.
4. **Analytics** — charts that feel alive and on-brand (use the app's tokens, not default chart colors).

## Design principles to hold
- Restraint first, flourish second. Every animation earns its place; nothing blocks the user from the content.
- Posters and people (cast/actors) are the visual stars — design around imagery.
- Consistency: one type scale, one spacing system, one motion language across all pages.
- Fast and responsive on a phone is non-negotiable — degrade the 3D/heavy effects there.

## Deliverables & working method
Work in this order and show me each before moving on:
1. **Design language doc**: chosen fonts (with rationale), color tokens, type scale, spacing/radii/shadows, motion principles, and the cinematic motif set. Include a `tailwind.config` theme extension and a global CSS setup (font-face, grain overlay, smooth scroll).
2. **Core component kit** (as `.tsx` + Tailwind): Navbar, MovieCard, buttons, StarRating, inputs/search, badges, skeletons — with their hover/motion states.
3. **Hero page redesigns**, in this priority: Landing → Movie detail → Recommendations "For You" → Analytics/Year in Review. Then the rest.
For each: briefly explain the design intent, then give production-ready React + TypeScript + Tailwind (+ Framer Motion/etc.) code I can drop into a Vite app. Note any libraries to `npm install`.

Be bold and genuinely creative — surprise me — but every idea must ship in this stack and never sacrifice speed, legibility, or mobile UX.
