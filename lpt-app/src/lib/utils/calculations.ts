/**
 * Estimate annual tax savings based on the difference between assessed and
 * market-supported value, multiplied by the local tax rate.
 *
 * @param assessedValue  Current assessed value from the county
 * @param marketValue    Estimated fair market value (or target value)
 * @param taxRate        Annual property tax rate as a percentage (e.g. 2.31)
 * @returns Estimated annual savings in dollars (floored to nearest dollar)
 */
export function estimateSavings(
  assessedValue: number,
  marketValue: number,
  taxRate: number,
): number {
  if (assessedValue <= marketValue) return 0;
  const reduction = assessedValue - marketValue;
  return Math.floor(reduction * (taxRate / 100));
}

/**
 * Calculate the return on investment for a property tax appeal.
 *
 * @param savings  Dollar amount saved (annually)
 * @param cost     Cost of the appeal service
 * @returns ROI as a percentage (e.g. 320 for 320%)
 */
export function calculateROI(savings: number, cost: number): number {
  if (cost <= 0) return 0;
  return Math.round((savings / cost) * 100);
}
