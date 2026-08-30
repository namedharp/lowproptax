/**
 * Format a number as USD currency.
 * Example: 28500 → "$28,500"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a number as a percentage string.
 * Example: 92 → "92%"
 */
export function formatPercent(value: number): string {
  return `${value}%`;
}

/**
 * Format an ISO date string to a human-readable date.
 * Example: "2025-08-15T10:00:00Z" → "Aug 15, 2025"
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a Property object into a full address string.
 * Example: "4521 Westheimer Rd, Houston, TX 77027"
 */
export function formatAddress(property: {
  address: string;
  city: string;
  state: string;
  zip: string;
}): string {
  return `${property.address}, ${property.city}, ${property.state} ${property.zip}`;
}
