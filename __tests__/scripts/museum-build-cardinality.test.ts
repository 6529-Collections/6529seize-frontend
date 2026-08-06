import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const {
  BASELINE_BUILD_ROUTES,
  BASELINE_GENERATED_PARAMS,
  CONTRACT,
  EXPECTED_BUILD_ROUTES_AFTER_REVIEWED_REDUCTION,
  EXPECTED_DYNAMIC_DECLARATION_ROUTES,
  EXPECTED_REMAINING_GENERATED_PARAMS,
  EXPECTED_REMAINING_EXPORTS,
  MAX_PRERENDERED_ROUTES,
  REVIEWED_HIGH_CARDINALITY_EXPORTS,
  REVIEWED_REDUCTION,
  analyze,
  assertCardinalityBaseline,
  assertReviewedExportsAbsent,
  readBuildEvidence,
} = require("../../scripts/museum-build-cardinality.cjs") as {
  BASELINE_BUILD_ROUTES: number;
  BASELINE_GENERATED_PARAMS: number;
  CONTRACT: string;
  EXPECTED_BUILD_ROUTES_AFTER_REVIEWED_REDUCTION: number;
  EXPECTED_DYNAMIC_DECLARATION_ROUTES: readonly string[];
  EXPECTED_REMAINING_GENERATED_PARAMS: number;
  EXPECTED_REMAINING_EXPORTS: readonly string[];
  MAX_PRERENDERED_ROUTES: number;
  REVIEWED_HIGH_CARDINALITY_EXPORTS: readonly { path: string }[];
  REVIEWED_REDUCTION: number;
  analyze: (options: { root: string; includeBuildEvidence: boolean }) => {
    sourceInventory: {
      baselineContributorCount: number;
      discoveredContributorCount: number;
      reviewedRemovedContributorCount: number;
      reviewedRemovedExports: readonly {
        estimatedParams: number;
        path: string;
      }[];
    };
    cardinality: {
      baselineBuildRoutes: number;
      baselineGenerateStaticParams: number;
      expectedBuildRoutesAfterReviewedReduction: number;
      expectedRemainingGenerateStaticParams: number;
      observedReviewedReduction: number;
      observedRemainingGenerateStaticParams: number;
      reviewedReduction: number;
    };
    contributors: readonly {
      estimatedParams: number;
      path: string;
    }[];
  };
  assertCardinalityBaseline: (observed: {
    observedGeneratedParams: number;
    observedReviewedReduction: number;
  }) => void;
  assertReviewedExportsAbsent: (discoveredPaths: readonly string[]) => void;
  readBuildEvidence: (options: { root: string; buildDirectory?: string }) => {
    applicationRouteEntries: number;
    dynamicPrerenderRouteEntries: number;
    evidencePaths: readonly string[];
    maxPrerenderedRoutes: number;
    prerenderedRoutes: number;
    requiredDynamicDeclarationRoutes: readonly string[];
  };
};

describe("Museum build cardinality contract", () => {
  it("inventories every remaining contributor and accounts for the reviewed reduction", () => {
    const report = analyze({
      root: process.cwd(),
      includeBuildEvidence: false,
    });

    expect(CONTRACT).toBe("museum-build-cardinality-v1");
    expect(report.sourceInventory.baselineContributorCount).toBe(23);
    expect(report.sourceInventory.discoveredContributorCount).toBe(
      EXPECTED_REMAINING_EXPORTS.length
    );
    expect(report.sourceInventory.reviewedRemovedContributorCount).toBe(
      REVIEWED_HIGH_CARDINALITY_EXPORTS.length
    );
    expect(report.sourceInventory.reviewedRemovedExports).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          estimatedParams: 19_432,
          path: REVIEWED_HIGH_CARDINALITY_EXPORTS.find(
            ({ path: relativePath }) =>
              relativePath.endsWith("/functions/[declarationKey]/page.tsx") &&
              relativePath.includes("/versions/")
          )?.path,
        }),
        expect.objectContaining({
          estimatedParams: 4_858,
          path: REVIEWED_HIGH_CARDINALITY_EXPORTS.find(
            ({ path: relativePath }) =>
              relativePath.endsWith("/functions/[declarationKey]/page.tsx") &&
              !relativePath.includes("/versions/")
          )?.path,
        }),
      ])
    );
    expect(report.cardinality).toMatchObject({
      baselineBuildRoutes: BASELINE_BUILD_ROUTES,
      baselineGenerateStaticParams: BASELINE_GENERATED_PARAMS,
      expectedBuildRoutesAfterReviewedReduction:
        EXPECTED_BUILD_ROUTES_AFTER_REVIEWED_REDUCTION,
      expectedRemainingGenerateStaticParams:
        EXPECTED_REMAINING_GENERATED_PARAMS,
      observedRemainingGenerateStaticParams:
        EXPECTED_REMAINING_GENERATED_PARAMS,
      observedReviewedReduction: REVIEWED_REDUCTION,
      reviewedReduction: REVIEWED_REDUCTION,
    });
    expect(
      report.contributors.reduce(
        (total, contributor) => total + contributor.estimatedParams,
        0
      )
    ).toBe(3_377);
  });

  it("fails closed if a reviewed high-cardinality page exports static params again", () => {
    const reviewedExport = REVIEWED_HIGH_CARDINALITY_EXPORTS[0];
    if (!reviewedExport) {
      throw new Error("Expected at least one reviewed high-cardinality export");
    }
    const reviewedPath = reviewedExport.path;
    expect(() => assertReviewedExportsAbsent([reviewedPath])).toThrow(
      reviewedPath
    );
  });

  it("fails closed when either source-cardinality estimate drifts", () => {
    expect(() =>
      assertCardinalityBaseline({
        observedGeneratedParams: EXPECTED_REMAINING_GENERATED_PARAMS + 1,
        observedReviewedReduction: REVIEWED_REDUCTION,
      })
    ).toThrow(
      `remaining generateStaticParams expected ${EXPECTED_REMAINING_GENERATED_PARAMS}, observed ${EXPECTED_REMAINING_GENERATED_PARAMS + 1}`
    );
    expect(() =>
      assertCardinalityBaseline({
        observedGeneratedParams: EXPECTED_REMAINING_GENERATED_PARAMS,
        observedReviewedReduction: REVIEWED_REDUCTION - 1,
      })
    ).toThrow(
      `reviewed reduction expected ${REVIEWED_REDUCTION}, observed ${REVIEWED_REDUCTION - 1}`
    );
  });

  it("reads emitted Next build evidence without making timing assumptions", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "museum-cardinality-"));
    try {
      fs.mkdirSync(path.join(root, ".next"), { recursive: true });
      fs.mkdirSync(path.join(root, ".next", "server"), { recursive: true });
      fs.writeFileSync(
        path.join(root, ".next", "prerender-manifest.json"),
        JSON.stringify({
          routes: Object.fromEntries(
            Array.from({ length: 241 }, (_, index) => [`/route-${index}`, {}])
          ),
          dynamicRoutes: {},
        })
      );
      fs.writeFileSync(
        path.join(root, ".next", "server", "app-paths-manifest.json"),
        JSON.stringify(
          Object.fromEntries(
            EXPECTED_DYNAMIC_DECLARATION_ROUTES.map((route) => [
              `${route}/page`,
              `app${route}/page.js`,
            ])
          )
        )
      );

      expect(readBuildEvidence({ root })).toEqual({
        applicationRouteEntries: 6,
        dynamicPrerenderRouteEntries: 0,
        maxPrerenderedRoutes: MAX_PRERENDERED_ROUTES,
        prerenderedRoutes: 241,
        requiredDynamicDeclarationRoutes: EXPECTED_DYNAMIC_DECLARATION_ROUTES,
        evidencePaths: [
          ".next/prerender-manifest.json",
          ".next/server/app-paths-manifest.json",
        ],
      });
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("accepts ordinary emitted-route growth inside the tight budget", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "museum-cardinality-"));
    try {
      fs.mkdirSync(path.join(root, ".next"), { recursive: true });
      fs.mkdirSync(path.join(root, ".next", "server"), { recursive: true });
      fs.writeFileSync(
        path.join(root, ".next", "prerender-manifest.json"),
        JSON.stringify({
          routes: Object.fromEntries(
            Array.from({ length: 400 }, (_, index) => [`/route-${index}`, {}])
          ),
          dynamicRoutes: {},
        })
      );
      fs.writeFileSync(
        path.join(root, ".next", "server", "app-paths-manifest.json"),
        JSON.stringify(
          Object.fromEntries(
            EXPECTED_DYNAMIC_DECLARATION_ROUTES.map((route) => [
              `${route}/page`,
              `app${route}/page.js`,
            ])
          )
        )
      );

      expect(readBuildEvidence({ root }).prerenderedRoutes).toBe(400);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects a build that drops a reviewed request-time dynamic route", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "museum-cardinality-"));
    try {
      fs.mkdirSync(path.join(root, ".next"), { recursive: true });
      fs.mkdirSync(path.join(root, ".next", "server"), { recursive: true });
      fs.writeFileSync(
        path.join(root, ".next", "prerender-manifest.json"),
        JSON.stringify({
          routes: Object.fromEntries(
            Array.from({ length: 241 }, (_, index) => [`/route-${index}`, {}])
          ),
          dynamicRoutes: {},
        })
      );
      fs.writeFileSync(
        path.join(root, ".next", "server", "app-paths-manifest.json"),
        JSON.stringify(
          Object.fromEntries(
            EXPECTED_DYNAMIC_DECLARATION_ROUTES.slice(1).map((route) => [
              `${route}/page`,
              `app${route}/page.js`,
            ])
          )
        )
      );

      expect(() => readBuildEvidence({ root })).toThrow(
        EXPECTED_DYNAMIC_DECLARATION_ROUTES[0]
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects a reviewed route that re-enters Next prerendering", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "museum-cardinality-"));
    try {
      fs.mkdirSync(path.join(root, ".next", "server"), { recursive: true });
      fs.writeFileSync(
        path.join(root, ".next", "prerender-manifest.json"),
        JSON.stringify({
          routes: {},
          dynamicRoutes: {
            [EXPECTED_DYNAMIC_DECLARATION_ROUTES[0] ?? ""]: {},
          },
        })
      );
      fs.writeFileSync(
        path.join(root, ".next", "server", "app-paths-manifest.json"),
        JSON.stringify(
          Object.fromEntries(
            EXPECTED_DYNAMIC_DECLARATION_ROUTES.map((route) => [
              `${route}/page`,
              `app${route}/page.js`,
            ])
          )
        )
      );

      expect(() => readBuildEvidence({ root })).toThrow(
        `prerendered=${EXPECTED_DYNAMIC_DECLARATION_ROUTES[0]}`
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects a build whose emitted route count regresses beyond the budget", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "museum-cardinality-"));
    try {
      fs.mkdirSync(path.join(root, ".next"), { recursive: true });
      fs.mkdirSync(path.join(root, ".next", "server"), { recursive: true });
      fs.writeFileSync(
        path.join(root, ".next", "prerender-manifest.json"),
        JSON.stringify({
          routes: Object.fromEntries(
            Array.from({ length: MAX_PRERENDERED_ROUTES + 1 }, (_, index) => [
              `/route-${index}`,
              {},
            ])
          ),
        })
      );
      fs.writeFileSync(
        path.join(root, ".next", "server", "app-paths-manifest.json"),
        JSON.stringify(
          Object.fromEntries(
            EXPECTED_DYNAMIC_DECLARATION_ROUTES.map((route) => [
              `${route}/page`,
              `app${route}/page.js`,
            ])
          )
        )
      );

      expect(() => readBuildEvidence({ root })).toThrow(
        "Museum build cardinality budget exceeded"
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
