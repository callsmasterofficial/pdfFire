/**
 * What redaction knows about one character an operator paints.
 *
 * Lives on its own so the coverage pipeline and the rewriter can share it
 * without importing each other.
 */
export interface CharMetric {
  /** Delete this character. */
  covered: boolean;
  /** Advance it occupies, in the space the rectangles use. */
  advance: number;
  /** Size of the run it belongs to. */
  fontSize: number;
  /**
   * TJ units that exactly restore its advance, from the font's own metrics.
   * Null when those were unavailable, in which case `advance` is an estimate.
   */
  tjUnits: number | null;
}
