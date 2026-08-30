import type { Property } from "@/lib/types";

/**
 * Search properties by matching a query string against address, city, or zip code.
 * The search is case-insensitive and matches partial strings.
 *
 * @param query       The search query string
 * @param properties  Array of Property objects to search through
 * @returns Filtered array of matching Property objects
 */
export function searchProperties(
  query: string,
  properties: Property[],
): Property[] {
  if (!query || query.trim() === "") return properties;

  const normalizedQuery = query.toLowerCase().trim();

  return properties.filter((property) => {
    const address = property.address.toLowerCase();
    const city = property.city.toLowerCase();
    const zip = property.zip.toLowerCase();

    return (
      address.includes(normalizedQuery) ||
      city.includes(normalizedQuery) ||
      zip.includes(normalizedQuery)
    );
  });
}
