import { useEffect, useState } from "react";

/**
 * Extract a dark ambient color from a poster image.
 *
 * Draws the image onto a tiny canvas (via our CORS-clean poster proxy),
 * averages the mid-luminance pixels, and clamps brightness into a
 * "dark room" band so it can tint backgrounds without fighting text.
 *
 * The theater lights change with the movie.
 */
export function useAmbientColor(imageUrl: string | null): string | null {
  const [color, setColor] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setColor(null);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      if (cancelled) return;
      try {
        const size = 16;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        let r = 0,
          g = 0,
          b = 0,
          n = 0;
        for (let i = 0; i < data.length; i += 4) {
          // Ignore near-black and near-white pixels — we want the film's hue
          const lum =
            0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
          if (lum < 20 || lum > 235) continue;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          n++;
        }
        if (n === 0) return;

        r /= n;
        g /= n;
        b /= n;

        // Clamp into the dark band: brightest channel ≈ 90/255
        const maxChannel = Math.max(r, g, b);
        const scale = maxChannel > 0 ? Math.min(1, 90 / maxChannel) : 1;

        setColor(
          `rgb(${Math.round(r * scale)} ${Math.round(g * scale)} ${Math.round(
            b * scale
          )})`
        );
      } catch {
        // Tainted canvas or decode issue — keep the token fallback
      }
    };

    img.src = imageUrl;
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return color;
}
