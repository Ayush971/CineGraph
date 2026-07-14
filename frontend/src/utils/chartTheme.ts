/**
 * Chart theme — PROJECTION design language.
 *
 * Mark colors are the palette-validated dark-surface steps
 * (validated: lightness band L 0.48–0.67, chroma, CVD ΔE 47.5, contrast ≥ 3:1):
 *   tungsten mark  #E8501C   (act hue, chart step)
 *   daylight mark  #0F9D8D   (navigate hue, chart step)
 *
 * Rules applied here (dataviz method):
 *  - single-series charts use ONE hue; no rainbow cycling
 *  - thin marks, 4px rounded ends anchored to the baseline
 *  - recessive grid, mono tick labels ("the slate")
 *  - tooltips are the hover layer — themed, no color swatch chip
 */

export const CHART = {
  tungsten: "#E8501C",
  tungstenSoft: "rgba(232, 80, 28, 0.9)",
  daylight: "#0F9D8D",
  daylightSoft: "rgba(15, 157, 141, 0.9)",
  ink: "#F4F1EC",
  inkMute: "#A8A29A",
  inkFaint: "#6F6A63",
  grid: "rgba(244, 241, 236, 0.06)",
  tooltipBg: "#262322",
  tooltipBorder: "rgba(244, 241, 236, 0.16)",
} as const;

const monoTicks = {
  color: CHART.inkFaint,
  font: {
    family: "'Spline Sans Mono Variable', ui-monospace, monospace",
    size: 10,
  },
};

export const tooltipTheme = {
  backgroundColor: CHART.tooltipBg,
  borderColor: CHART.tooltipBorder,
  borderWidth: 1,
  titleColor: CHART.ink,
  bodyColor: CHART.inkMute,
  titleFont: {
    family: "'Spline Sans Mono Variable', ui-monospace, monospace",
    size: 11,
  },
  bodyFont: {
    family: "'Instrument Sans Variable', system-ui, sans-serif",
    size: 12,
  },
  padding: 10,
  cornerRadius: 8,
  displayColors: false,
} as const;

/** Options for a single-series bar chart (vertical by default). */
export function barOptions(horizontal = false) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: (horizontal ? "y" : "x") as "x" | "y",
    plugins: {
      legend: { display: false }, // single series — the title names it
      tooltip: tooltipTheme,
    },
    scales: {
      x: {
        ticks: horizontal ? { ...monoTicks, precision: 0 } : monoTicks,
        grid: horizontal ? { color: CHART.grid } : { display: false },
        border: { display: false },
      },
      y: {
        ticks: horizontal
          ? {
              color: CHART.inkMute,
              font: {
                family: "'Instrument Sans Variable', system-ui, sans-serif",
                size: 12,
              },
            }
          : { ...monoTicks, precision: 0 },
        grid: horizontal ? { display: false } : { color: CHART.grid },
        border: { display: false },
      },
    },
  };
}

/** Bar dataset styling: thin marks, rounded data-end anchored to baseline. */
export function barDataset(color: string) {
  return {
    backgroundColor: color,
    borderRadius: 4,
    borderSkipped: "start" as const, // rounded end is the data end only
    maxBarThickness: 26,
    categoryPercentage: 0.72,
  };
}
