import type {
  LinkPreviewMedia,
  SeizeCollectionLinkPreview,
  SeizeCollectionPreviewFact,
  SeizeCollectionPreviewKind,
  SeizeCollectionPreviewPerson,
  SeizeCollectionPreviewTrait,
} from "@/services/api/link-preview-api";
import { fetchOptionalApiJson, type ApiContext } from "./apiClient";

export type AttributeRecord = {
  readonly trait_type?: string | null | undefined;
  readonly value?: string | number | null | undefined;
};

type PreviewBuildInput = {
  readonly kind: SeizeCollectionPreviewKind;
  readonly requestUrl: URL;
  readonly title: string;
  readonly kicker?: string | null | undefined;
  readonly people?: readonly SeizeCollectionPreviewPerson[] | undefined;
  readonly facts?: readonly SeizeCollectionPreviewFact[] | undefined;
  readonly traits?: readonly SeizeCollectionPreviewTrait[] | undefined;
  readonly liveMint?: SeizeCollectionLinkPreview["liveMint"];
  readonly imageUrl?: string | null | undefined;
};

type IdentityResponse = {
  readonly handle?: string | null | undefined;
  readonly normalised_handle?: string | null | undefined;
  readonly display?: string | null | undefined;
  readonly primary_wallet?: string | null | undefined;
};

export function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

export function parseMetadata(value: unknown): Record<string, unknown> | null {
  if (typeof value === "string") {
    try {
      return asRecord(JSON.parse(value));
    } catch {
      return null;
    }
  }

  return asRecord(value);
}

export function readString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
}

export function readNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function readPositiveNumber(value: unknown): number | undefined {
  const parsed = readNumber(value);
  return parsed !== undefined && parsed > 0 ? parsed : undefined;
}

export function readTheMemesTdhRateValue(
  hodlRate: unknown,
  recordedInTdh: boolean | null | undefined
): string | undefined {
  if (recordedInTdh === false) {
    return "Pending";
  }

  const tdhRate = readPositiveNumber(hodlRate);
  if (tdhRate === undefined) {
    return undefined;
  }
  return formatDecimal(tdhRate);
}

export function readMetadataString(
  metadata: Record<string, unknown> | null,
  key: string
): string | undefined {
  return metadata ? readString(metadata[key]) : undefined;
}

export function readAttributes(
  metadata: Record<string, unknown> | null
): readonly AttributeRecord[] {
  const attributes = metadata?.["attributes"];
  return Array.isArray(attributes) ? (attributes as AttributeRecord[]) : [];
}

function normalizeTraitType(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replaceAll(/\s+/g, " ");
}

export function readAttributeValue(
  attributes: readonly AttributeRecord[],
  traitType: string
): string | undefined {
  const normalizedTrait = normalizeTraitType(traitType);
  const match = attributes.find(
    (attribute) => normalizeTraitType(attribute.trait_type) === normalizedTrait
  );

  return readString(match?.value);
}

export function firstNonEmptyString(
  ...values: readonly unknown[]
): string | undefined {
  for (const value of values) {
    const stringValue = readString(value);
    if (stringValue) {
      return stringValue;
    }
  }

  return undefined;
}

export function firstPositiveNumber(
  ...values: readonly unknown[]
): number | undefined {
  for (const value of values) {
    const numberValue = readPositiveNumber(value);
    if (numberValue !== undefined) {
      return numberValue;
    }
  }

  return undefined;
}

export function formatInteger(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDecimal(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatMintDate(value: unknown): string | undefined {
  const raw = readString(value);
  if (!raw) {
    return undefined;
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}

export function createFact(
  label: string,
  value: string | number | undefined
): SeizeCollectionPreviewFact | null {
  const stringValue = readString(value);
  return stringValue ? { label, value: stringValue } : null;
}

export function compactFacts(
  facts: readonly (SeizeCollectionPreviewFact | null | undefined)[]
): SeizeCollectionPreviewFact[] {
  return facts.filter(
    (fact): fact is SeizeCollectionPreviewFact =>
      fact !== null && fact !== undefined
  );
}

function normalizeHttpsImageUrl(value: unknown): string | undefined {
  const url = readString(value);
  if (!url) {
    return undefined;
  }

  try {
    const parsed = new URL(url, "https://6529.io");
    return parsed.protocol === "https:" ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function selectHttpsImageUrl(
  ...values: readonly unknown[]
): string | undefined {
  for (const value of values) {
    const url = normalizeHttpsImageUrl(value);
    if (url) {
      return url;
    }
  }

  return undefined;
}

function createImageMedia(url: string | undefined): LinkPreviewMedia | null {
  const normalizedUrl = normalizeHttpsImageUrl(url);
  return normalizedUrl
    ? { url: normalizedUrl, secureUrl: normalizedUrl }
    : null;
}

export function buildPreview(
  input: PreviewBuildInput
): SeizeCollectionLinkPreview {
  const image = createImageMedia(input.imageUrl ?? undefined);
  const descriptionParts = [
    input.kicker,
    ...(input.people ?? []).map((person) =>
      person.label ? `${person.label} ${person.name}` : person.name
    ),
    ...(input.facts ?? []).map((fact) => `${fact.label} ${fact.value}`),
  ].filter((part): part is string => Boolean(part));

  return {
    type: "6529.collection",
    kind: input.kind,
    requestUrl: input.requestUrl.toString(),
    url: input.requestUrl.toString(),
    title: input.title,
    description:
      descriptionParts.length > 0 ? descriptionParts.join(" | ") : null,
    siteName: "6529",
    mediaType: null,
    contentType: null,
    favicon: null,
    favicons: [],
    image,
    images: image ? [image] : [],
    kicker: input.kicker ?? null,
    people: input.people ?? [],
    facts: input.facts ?? [],
    traits: input.traits ?? [],
    liveMint: input.liveMint ?? null,
  };
}

export function firstHandle(
  value: string | null | undefined
): string | undefined {
  return value
    ?.split(",")
    .map((handle) => handle.trim().replace(/^@/, ""))
    .find((handle) => handle.length > 0);
}

export function profileHrefForHandle(
  value: string | null | undefined
): string | undefined {
  const handle = firstHandle(value);
  return handle ? `/${handle}` : undefined;
}

export function createPerson({
  label,
  name,
  href,
}: {
  readonly label?: string | null | undefined;
  readonly name?: string | null | undefined;
  readonly href?: string | null | undefined;
}): SeizeCollectionPreviewPerson | null {
  const displayName = readString(name);
  if (!displayName) {
    return null;
  }

  const normalizedHref = readString(href);

  return {
    ...(label ? { label } : {}),
    name: displayName,
    ...(normalizedHref ? { href: normalizedHref } : {}),
  };
}

export function compactPeople(
  people: readonly (SeizeCollectionPreviewPerson | null | undefined)[]
): SeizeCollectionPreviewPerson[] {
  return people.filter(
    (person): person is SeizeCollectionPreviewPerson =>
      person !== null && person !== undefined
  );
}

function profileLookupCandidate(value: unknown): string | null {
  const normalized = readString(value)?.replace(/^@/, "");
  if (!normalized || normalized.includes(",") || normalized.includes(" ")) {
    return null;
  }

  return normalized;
}

function identityProfileHandle(
  profile: IdentityResponse | null | undefined
): string | undefined {
  return firstNonEmptyString(profile?.handle, profile?.normalised_handle);
}

export function identityProfileHref(
  profile: IdentityResponse | null | undefined
): string | undefined {
  const handle = identityProfileHandle(profile);
  return handle ? `/${handle.replace(/^@/, "")}` : undefined;
}

export function identityProfileDisplay(
  profile: IdentityResponse | null | undefined
): string | undefined {
  return firstNonEmptyString(
    profile?.display,
    profile?.handle,
    profile?.normalised_handle
  );
}

export async function resolveProfileHref(
  value: unknown,
  context?: ApiContext
): Promise<string | undefined> {
  const candidate = profileLookupCandidate(value);
  if (!candidate) {
    return undefined;
  }

  const profile = await resolveIdentityProfile(candidate, context);
  return identityProfileHref(profile);
}

export async function resolveIdentityProfile(
  value: unknown,
  context?: ApiContext
): Promise<IdentityResponse | null> {
  const candidate = profileLookupCandidate(value);
  if (!candidate) {
    return null;
  }

  return await fetchOptionalApiJson<IdentityResponse>(
    `identities/${encodeURIComponent(candidate.toLowerCase())}`,
    undefined,
    context
  );
}
