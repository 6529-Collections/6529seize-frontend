jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });
jest.mock("next/server", () => ({ connection: jest.fn() }));

import activeManifest from "@/public/review-data/6529-stream/versions/2026-08-01.1/reference-manifest.json";
import historicalManifest from "@/public/review-data/6529-stream/versions/2026-07-26.1/reference-manifest.json";
import ActiveFunctionPage from "@/app/reviews/[review]/reference/definitions/[definitionKey]/functions/[declarationKey]/page";
import HistoricalFunctionPage from "@/app/reviews/[review]/versions/[version]/reference/definitions/[definitionKey]/functions/[declarationKey]/page";
import { getSolidityDeclarationHref } from "@/lib/public-review/solidityReferenceRoutes";
import { resolveStreamReferenceRouteOrNotFound } from "@/lib/public-review/streamSolidityReferencePageAdapter";
import { STREAM_REVIEW_SLUG } from "@/lib/public-review/streamReviewDefinition";

jest.mock("@/lib/public-review/streamSolidityDeclarationRoute", () => {
  const actual = jest.requireActual(
    "@/lib/public-review/streamSolidityDeclarationRoute"
  );
  return {
    ...actual,
    renderSolidityDeclarationRoute: jest.fn((value) => value),
  };
});

const { renderSolidityDeclarationRoute: mockRenderSolidityDeclarationRoute } =
  jest.requireMock("@/lib/public-review/streamSolidityDeclarationRoute") as {
    renderSolidityDeclarationRoute: jest.Mock;
  };

const activeDeclaration = activeManifest.declarationIndex.find(
  (declaration) =>
    declaration.kind === "function" &&
    !declaration.topLevel &&
    Boolean(declaration.definitionKey)
);
const historicalDeclaration = historicalManifest.declarationIndex.find(
  (declaration) =>
    declaration.kind === "function" &&
    !declaration.topLevel &&
    Boolean(declaration.definitionKey)
);

if (!activeDeclaration || !historicalDeclaration) {
  throw new Error("The dynamic declaration route fixtures are incomplete.");
}

const activeParams = {
  declarationKey: activeDeclaration.key,
  definitionKey: activeDeclaration.definitionKey,
  review: STREAM_REVIEW_SLUG,
} as const;
const historicalParams = {
  declarationKey: historicalDeclaration.key,
  definitionKey: historicalDeclaration.definitionKey,
  review: STREAM_REVIEW_SLUG,
  version: "2026-07-26.1",
} as const;

describe("Stream declaration routes without static parameter enumeration", () => {
  beforeEach(() => {
    mockRenderSolidityDeclarationRoute.mockClear();
  });

  it("passes an active declaration deep link to the request-time renderer", async () => {
    await expect(
      ActiveFunctionPage({ params: Promise.resolve(activeParams) })
    ).resolves.toEqual({ kind: "functions", params: activeParams });

    expect(mockRenderSolidityDeclarationRoute).toHaveBeenCalledWith({
      kind: "functions",
      params: activeParams,
    });
    expect(
      getSolidityDeclarationHref({
        declarationKey: activeParams.declarationKey,
        definitionKey: activeParams.definitionKey,
        kind: "functions",
        reviewSlug: activeParams.review,
      })
    ).toBe(
      `/reviews/${STREAM_REVIEW_SLUG}/reference/definitions/${activeParams.definitionKey}/functions/${activeParams.declarationKey}`
    );
  });

  it("passes an immutable historical declaration deep link to the request-time renderer", async () => {
    await expect(
      HistoricalFunctionPage({ params: Promise.resolve(historicalParams) })
    ).resolves.toEqual({ kind: "functions", params: historicalParams });

    expect(mockRenderSolidityDeclarationRoute).toHaveBeenCalledWith({
      kind: "functions",
      params: historicalParams,
    });
    expect(
      getSolidityDeclarationHref({
        declarationKey: historicalParams.declarationKey,
        definitionKey: historicalParams.definitionKey,
        kind: "functions",
        reviewSlug: historicalParams.review,
        version: historicalParams.version,
      })
    ).toBe(
      `/reviews/${STREAM_REVIEW_SLUG}/versions/2026-07-26.1/reference/definitions/${historicalParams.definitionKey}/functions/${historicalParams.declarationKey}`
    );
  });

  it("keeps active and historical versions in the existing fail-closed resolver", () => {
    expect(
      resolveStreamReferenceRouteOrNotFound({
        baseEndpoint: "http://localhost:3001",
        params: activeParams,
      })
    ).toEqual({ version: "2026-08-01.1" });
    expect(
      resolveStreamReferenceRouteOrNotFound({
        baseEndpoint: "http://localhost:3001",
        params: historicalParams,
      })
    ).toEqual({ version: "2026-07-26.1", routeVersion: "2026-07-26.1" });
  });
});
