// Shared sparkline geometry. `spark` series are normalized into the
// SPARK_W × SPARK_H box and emitted as an SVG polyline `points` string.
// Used by the market snapshot panel and the market-overview breadth widget.
export const SPARK_W = 120;
export const SPARK_H = 34;

// Build an SVG polyline `points` string from a spark series, normalized to fit
// the SPARK_W × SPARK_H box.
export function sparkPoints(spark: number[]): string {
  if (spark.length < 2) {
    return "";
  }
  const min = Math.min(...spark);
  const max = Math.max(...spark);
  const span = max - min || 1;
  const step = SPARK_W / (spark.length - 1);
  const pad = 4;
  const usable = SPARK_H - pad * 2;

  return spark
    .map((point, i) => {
      const x = i * step;
      const y = pad + (1 - (point - min) / span) * usable;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}
