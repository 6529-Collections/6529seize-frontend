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

// On Capacitor iOS the IP country is unknown until the first lookup settles,
// and `shouldHideSubscriptions` treats an unknown country as restricted. That
// keeps purchasing hidden while the lookup is pending, but redirects must wait
// so a US deep link is not bounced away before US resolves. Android and web
// never wait.
export const isAwaitingIosCountryCheck = ({
  capacitorIsIos,
  isCountryPending,
}: {
  readonly capacitorIsIos: boolean;
  readonly isCountryPending: boolean;
}): boolean => capacitorIsIos && isCountryPending;
