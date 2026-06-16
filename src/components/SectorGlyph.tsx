// Hand-drawn category glyphs on a 24-unit grid, 1.5 stroke, round joins.
// Distinct from SectorIcon (Lucide) — these are tuned for the larger sector
// health cards. Keys match root sector names case-insensitively by substring.
const GLYPHS: Array<{ match: string; path: string }> = [
  // classical bank facade — pediment, columns, plinth
  {
    match: "financial",
    path: "M3.2 9.4 12 4l8.8 5.4M5 9.6v7.6M9.4 9.6v7.6M14.6 9.6v7.6M19 9.6v7.6M3.6 17.4h16.8M2.8 20h18.4"
  },
  // shopping bag with rounded handle
  {
    match: "consumer discretionary",
    path: "M5.6 8.2h12.8l-.95 11.1a1.2 1.2 0 0 1-1.2 1.1H7.75a1.2 1.2 0 0 1-1.2-1.1L5.6 8.2ZM8.7 8.2V6.6a3.3 3.3 0 0 1 6.6 0v1.6"
  },
  // shopping cart
  {
    match: "fast moving consumer",
    path: "M3 4.2h2.1l2.25 11.1a1.2 1.2 0 0 0 1.18.96h8.4a1.2 1.2 0 0 0 1.17-.93L20.7 8.2H6.1"
  },
  // factory — sawtooth roof, chimney, ground
  {
    match: "industrial",
    path: "M3 20.2V10.4l4.4 2.7V10.4l4.4 2.7V10.4l4.4 2.7M16.2 13.1V5.2h3.4v15M3 20.2h18M6.4 16.6v1.4M10.8 16.6v1.4"
  },
  // stacked bullion bars — pyramid
  {
    match: "commodit",
    path: "M3.6 14.4h16.8v4.4H3.6zM6.2 9.6h11.6v4.4H6.2zM8.8 4.8h6.4v4.4H8.8z"
  },
  // cog / settings — services
  {
    match: "service",
    path: "M12 2.6v3.1M12 18.3v3.1M2.6 12h3.1M18.3 12h3.1M5.1 5.1l2.2 2.2M16.7 16.7l2.2 2.2M18.9 5.1l-2.2 2.2M7.3 16.7l-2.2 2.2"
  }
];

// circle drawn separately for the cog (services) so we can keep a clean center
const CIRCLE_FOR = (name: string) => name.toLowerCase().includes("service");

function glyphFor(name: string): string {
  const lower = name.toLowerCase();
  for (const { match, path } of GLYPHS) {
    if (lower.includes(match)) return path;
  }
  // fallback: simple layered-stack glyph
  return "M4 7h16M4 12h16M4 17h16";
}

export function SectorGlyph({ name, size = 19 }: { name: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {CIRCLE_FOR(name) ? <circle cx="12" cy="12" r="3.1" /> : null}
      <path d={glyphFor(name)} />
    </svg>
  );
}
