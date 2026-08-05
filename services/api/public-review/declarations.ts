import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type {
  SolidityDeclarationSearchKind,
  SolidityDeclarationSearchLocation,
  SolidityDeclarationSearchPage,
} from "@/lib/public-review/solidityDeclarationSearchTypes";
import { commonApiFetch } from "@/services/api/common-api";

interface FetchSolidityDeclarationsInput {
  readonly kind: SolidityDeclarationSearchKind;
  readonly limit: number;
  readonly linkMode: "active" | "versioned";
  readonly location: SolidityDeclarationSearchLocation;
  readonly offset: number;
  readonly query: string;
  readonly reviewId: string;
  readonly scope: string;
  readonly signal?: AbortSignal | undefined;
  readonly sourceCommit: string;
  readonly version: string;
}

export function getSolidityDeclarationsQueryKey(
  input: Omit<
    FetchSolidityDeclarationsInput,
    "limit" | "offset" | "signal" | "sourceCommit"
  >
) {
  return [
    QueryKey.PUBLIC_REVIEW_DECLARATIONS,
    {
      kind: input.kind,
      linkMode: input.linkMode,
      location: input.location,
      query: input.query,
      reviewId: input.reviewId,
      scope: input.scope,
      version: input.version,
    },
  ] as const;
}

export async function fetchSolidityDeclarations({
  kind,
  limit,
  linkMode,
  location,
  offset,
  query,
  reviewId,
  scope,
  signal,
  sourceCommit,
  version,
}: FetchSolidityDeclarationsInput): Promise<SolidityDeclarationSearchPage> {
  const page = await commonApiFetch<SolidityDeclarationSearchPage>({
    endpoint: `public-reviews/${encodeURIComponent(reviewId)}/declarations`,
    errorMode: "structured",
    includeWalletAuth: false,
    params: {
      kind,
      limit: `${limit}`,
      links: linkMode,
      location,
      offset: `${offset}`,
      q: query,
      scope,
      version,
    },
    requestOrigin: "app",
    signal,
  });
  if (
    page.reviewId !== reviewId ||
    page.version !== version ||
    page.sourceCommit !== sourceCommit
  ) {
    throw new Error(
      "The declaration response does not match the pinned review version."
    );
  }
  return page;
}
