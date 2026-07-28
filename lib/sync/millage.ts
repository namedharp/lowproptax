import "server-only";

export type MillageProperty = {
  externalId: string;
  apn: string;
  address: string;
  city: string;
  propertyType: string;
  landUse?: string;
  yearBuilt?: number;
  buildingSqft?: number;
  lotSqft?: number;
  assessedValue?: number;
  taxYear?: number;
};

export function millageIsConfigured(): boolean {
  const url = process.env.MILLAGE_API_URL;
  return Boolean(
    url?.startsWith("https://") &&
      process.env.MILLAGE_API_KEY &&
      process.env.MILLAGE_API_KEY.length >= 16,
  );
}

export async function getMillageProperty(
  externalPropertyId: string,
): Promise<MillageProperty | null> {
  if (!millageIsConfigured()) {
    throw new Error("The secure read-only Millage HTTPS API is not configured.");
  }
  const template =
    process.env.MILLAGE_PROPERTY_PATH_TEMPLATE ?? "/v1/properties/{id}";
  const path = template.replace("{id}", encodeURIComponent(externalPropertyId));
  const endpoint = new URL(path, process.env.MILLAGE_API_URL);
  const response = await fetch(endpoint, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${process.env.MILLAGE_API_KEY}`,
    },
    signal: AbortSignal.timeout(15000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Millage API returned ${response.status}.`);
  return normalizeMillageProperty(
    (await response.json()) as Record<string, unknown>,
    externalPropertyId,
  );
}

export function normalizeMillageProperty(
  raw: Record<string, unknown>,
  externalId: string,
): MillageProperty {
  const county = text(raw.county, raw.county_name) ?? "";
  if (county.toLowerCase().replace(/\s+county$/, "") !== "sacramento") {
    throw new Error("Millage returned a property outside Sacramento County.");
  }
  return {
    externalId,
    apn: text(raw.apn, raw.parcel_number, raw.parcel) ?? `pending-${externalId}`,
    address: text(raw.address, raw.situs_address) ?? "Address pending",
    city: text(raw.city, raw.situs_city) ?? "Sacramento",
    propertyType:
      text(raw.property_type, raw.propertyType) ?? "Pending enrichment",
    landUse: text(raw.land_use, raw.landUse),
    yearBuilt: number(raw.year_built, raw.yearBuilt),
    buildingSqft: number(raw.sqft_building, raw.building_sqft),
    lotSqft: number(raw.sqft_lot, raw.lot_sqft),
    assessedValue: number(raw.assessed_value, raw.enrolled_value),
    taxYear: number(raw.tax_year, raw.taxYear),
  };
}

function text(...values: unknown[]): string | undefined {
  const value = values.find(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
  return value?.trim();
}

function number(...values: unknown[]): number | undefined {
  const value = values.find(
    (item) =>
      typeof item === "number" ||
      (typeof item === "string" && item.trim().length > 0),
  );
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
