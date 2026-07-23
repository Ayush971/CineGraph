import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "lenis";

/**
 * Global smooth scrolling (Lenis) + scroll-to-top on route change.
 * Skips itself entirely when the user prefers reduced motion.
 *
 * Two things Lenis needs that are easy to miss:
 *  - `lenis/dist/lenis.css` must be imported (done in main.tsx) so html/body
 *    are height:auto. A fixed height makes Lenis stop short of the real bottom.
 *  - `resize()` must be called whenever the page height changes, or its cached
 *    scroll limit goes stale and the last stretch becomes unreachable by wheel.
 */
const SmoothScroll: React.FC = () => {
  const { pathname } = useLocation();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const lenis = new Lenis({ lerp: 0.12 });
    lenisRef.current = lenis;

    // Handy for debugging scroll issues from the console (dev builds only).
    if (import.meta.env.DEV) {
      (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    }

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Posters, charts and async data land after mount and grow the page —
    // recompute the scroll limit whenever that happens.
    const observer = new ResizeObserver(() => lenis.resize());
    observer.observe(document.body);

    // Images without fixed dimensions also shift height as they decode.
    const onLoad = () => lenis.resize();
    window.addEventListener("load", onLoad);

    return () => {
      observer.disconnect();
      window.removeEventListener("load", onLoad);
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    const lenis = lenisRef.current;
    if (lenis) {
      // Go through Lenis, not window.scrollTo — the two fight each other.
      lenis.scrollTo(0, { immediate: true });
      lenis.resize();
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
};

export default SmoothScroll;
