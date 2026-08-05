import {
  fetchSolidityDeclarations,
  getSolidityDeclarationsQueryKey,
} from "@/services/api/public-review/declarations";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const mockCommonApiFetch = commonApiFetch as jest.MockedFunction<
  typeof commonApiFetch
>;

const INPUT = {
  kind: "function" as const,
  limit: 100,
  linkMode: "versioned" as const,
  location: "definition" as const,
  offset: 200,
  query: "mint",
  reviewId: "6529-stream",
  scope: "protocol",
  sourceCommit: "513bd7e079eafe109df6ae1ae21bfbca6fec6786",
  version: "2026-07-26.1",
};

describe("public review declaration API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("queries the same-origin review route with the exact pinned version", async () => {
    mockCommonApiFetch.mockResolvedValue({
      items: [],
      nextOffset: null,
      reviewId: INPUT.reviewId,
      sourceCommit: INPUT.sourceCommit,
      total: 0,
      version: INPUT.version,
    });

    await expect(fetchSolidityDeclarations(INPUT)).resolves.toMatchObject({
      reviewId: INPUT.reviewId,
      version: INPUT.version,
    });
    expect(mockCommonApiFetch).toHaveBeenCalledWith({
      endpoint: "public-reviews/6529-stream/declarations",
      errorMode: "structured",
      includeWalletAuth: false,
      params: {
        kind: "function",
        limit: "100",
        links: "versioned",
        location: "definition",
        offset: "200",
        q: "mint",
        scope: "protocol",
        version: "2026-07-26.1",
      },
      requestOrigin: "app",
      signal: undefined,
    });
  });

  it("rejects a response that drifts from the requested source pin", async () => {
    mockCommonApiFetch.mockResolvedValue({
      items: [],
      nextOffset: null,
      reviewId: INPUT.reviewId,
      sourceCommit: "different",
      total: 0,
      version: INPUT.version,
    });

    await expect(fetchSolidityDeclarations(INPUT)).rejects.toThrow(
      "does not match the pinned review version"
    );
  });

  it("keys cached pages by every search dimension and exact version", () => {
    expect(
      getSolidityDeclarationsQueryKey({
        kind: INPUT.kind,
        linkMode: INPUT.linkMode,
        location: INPUT.location,
        query: INPUT.query,
        reviewId: INPUT.reviewId,
        scope: INPUT.scope,
        version: INPUT.version,
      })
    ).toEqual([
      "PUBLIC_REVIEW_DECLARATIONS",
      {
        kind: "function",
        linkMode: "versioned",
        location: "definition",
        query: "mint",
        reviewId: "6529-stream",
        scope: "protocol",
        version: "2026-07-26.1",
      },
    ]);
  });
});
