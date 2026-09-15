export type NftCollectionRoute = "the-memes" | "meme-lab";

type NftFocusPolicy = {
  readonly canonicalFocus: string | null;
  readonly indexable: boolean;
  readonly includeInSitemap: boolean;
};

const BASE_POLICY: NftFocusPolicy = {
  canonicalFocus: null,
  indexable: true,
  includeInSitemap: false,
};

const SHARED_FOCUS_POLICIES: Readonly<Record<string, NftFocusPolicy>> = {
  activity: {
    canonicalFocus: "activity",
    indexable: true,
    includeInSitemap: true,
  },
  collectors: {
    canonicalFocus: "collectors",
    indexable: true,
    includeInSitemap: true,
  },
  history: {
    canonicalFocus: "activity",
    indexable: true,
    includeInSitemap: false,
  },
  live: BASE_POLICY,
  "listings-and-offers": {
    canonicalFocus: "listings-and-offers",
    indexable: false,
    includeInSitemap: false,
  },
  "the-art": BASE_POLICY,
  timeline: {
    canonicalFocus: "timeline",
    indexable: true,
    includeInSitemap: true,
  },
  "your-cards": {
    canonicalFocus: "your-cards",
    indexable: false,
    includeInSitemap: false,
  },
  "your-transactions": {
    canonicalFocus: "your-transactions",
    indexable: false,
    includeInSitemap: false,
  },
};

const COLLECTION_FOCUS_POLICIES: Readonly<
  Record<NftCollectionRoute, Readonly<Record<string, NftFocusPolicy>>>
> = {
  "the-memes": {
    references: BASE_POLICY,
  },
  "meme-lab": {
    references: {
      canonicalFocus: "references",
      indexable: true,
      includeInSitemap: true,
    },
  },
};

export function getNftFocusPolicy(
  collection: NftCollectionRoute,
  requestedFocus: string | null | undefined
): NftFocusPolicy {
  const focus = requestedFocus?.trim().toLowerCase();
  if (!focus) {
    return BASE_POLICY;
  }

  return (
    COLLECTION_FOCUS_POLICIES[collection][focus] ??
    SHARED_FOCUS_POLICIES[focus] ??
    BASE_POLICY
  );
}

export function getNftCanonicalPath({
  collection,
  id,
  requestedFocus,
}: {
  readonly collection: NftCollectionRoute;
  readonly id: string | number;
  readonly requestedFocus?: string | null;
}): string {
  const basePath = `/${collection}/${encodeURIComponent(String(id))}`;
  const { canonicalFocus } = getNftFocusPolicy(collection, requestedFocus);
  return canonicalFocus
    ? `${basePath}?${new URLSearchParams({ focus: canonicalFocus }).toString()}`
    : basePath;
}

export function getNftSitemapFocuses(
  collection: NftCollectionRoute
): readonly string[] {
  const allFocuses = new Set([
    ...Object.keys(SHARED_FOCUS_POLICIES),
    ...Object.keys(COLLECTION_FOCUS_POLICIES[collection]),
  ]);

  return [...allFocuses]
    .filter((focus) => getNftFocusPolicy(collection, focus).includeInSitemap)
    .sort((left, right) => left.localeCompare(right));
}
