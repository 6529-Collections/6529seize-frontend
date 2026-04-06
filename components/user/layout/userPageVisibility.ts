"use client";

const normalizeCountry = (
  country: string | null | undefined
): string | null => {
  if (typeof country !== "string") {
    return null;
  }

  const trimmed = country.trim();
  return trimmed ? trimmed.toUpperCase() : null;
};

export const shouldHideSubscriptions = ({
  capacitorIsIos,
  country,
}: {
  readonly capacitorIsIos: boolean;
  readonly country: string | null | undefined;
}): boolean => {
  const normalizedCountry = normalizeCountry(country);
  return capacitorIsIos && normalizedCountry !== "US";
};
