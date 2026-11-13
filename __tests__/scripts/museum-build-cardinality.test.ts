import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const {
  CONTRACT,
  EXPECTED_REMAINING_EXPORTS,
  MAX_PRERENDERED_ROUTES,
  analyze,
  assertExpectedContributorSet,
  readBuildEvidence,
} = require("../../scripts/museum-build-cardinality.cjs") as {
  CONTRACT: string;
  EXPECTED_REMAINING_EXPORTS: readonly string[];
  MAX_PRERENDERED_ROUTES: number;
  analyze: (options: { root: string; includeBuildEvidence: boolean }) => {
    sourceInventory: { discoveredContributorCount: number };
    cardinality: {
      observedGenerateStaticParams: number;
      maxPrerenderedRoutes: number;
    };
    contributors: readonly { estimatedParams: number; path: string }[];
  };
  assertExpectedContributorSet: (discoveredPaths: readonly string[]) => void;
  readBuildEvidence: (options: { root: string; buildDirectory?: string }) => {
    applicationRouteEntries: number;
    dynamicPrerenderRouteEntries: number;
    evidencePaths: readonly string[];
    maxPrerenderedRoutes: number;
    prerenderedRoutes: number;
  };
};

function writeBuildEvidence(root: string, prerenderedRoutes: number): void {
  fs.mkdirSync(path.join(root, ".next", "server"), { recursive: true });
  fs.writeFileSync(
    path.join(root, ".next", "prerender-manifest.json"),
    JSON.stringify({
      routes: Object.fromEntries(
        Array.from({ length: prerenderedRoutes }, (_, index) => [
          `/route-${index}`,
          {},
        ])
      ),
      dynamicRoutes: {},
    })
  );
  fs.writeFileSync(
    path.join(root, ".next", "server", "app-paths-manifest.json"),
    JSON.stringify({ "/waves/page": "app/waves/page.js" })
  );
}

describe("Museum build cardinality contract", () => {
  it("inventories every generateStaticParams contributor", () => {
    const report = analyze({
      root: process.cwd(),
      includeBuildEvidence: false,
    });

    expect(CONTRACT).toBe("museum-build-cardinality-v2");
    expect(report.sourceInventory.discoveredContributorCount).toBe(
      EXPECTED_REMAINING_EXPORTS.length
    );
    expect(report.contributors.map((contributor) => contributor.path)).toEqual(
      [...EXPECTED_REMAINING_EXPORTS]
    );
    expect(report.cardinality.maxPrerenderedRoutes).toBe(
      MAX_PRERENDERED_ROUTES
    );
    expect(report.cardinality.observedGenerateStaticParams).toBe(
      report.contributors.reduce(
        (total, contributor) => total + contributor.estimatedParams,
        0
      )
    );
  });

  it("fails closed when a page starts or stops exporting static params", () => {
    expect(() =>
      assertExpectedContributorSet([
        ...EXPECTED_REMAINING_EXPORTS,
        "app/new/[id]/page.tsx",
      ])
    ).toThrow("unknown=app/new/[id]/page.tsx");
    expect(() => assertExpectedContributorSet([])).toThrow(
      `missing=${EXPECTED_REMAINING_EXPORTS.join(",")}`
    );
  });

  it("reads emitted Next build evidence inside the budget", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "museum-cardinality-"));
    try {
      writeBuildEvidence(root, 400);

      expect(readBuildEvidence({ root })).toEqual({
        applicationRouteEntries: 1,
        dynamicPrerenderRouteEntries: 0,
        maxPrerenderedRoutes: MAX_PRERENDERED_ROUTES,
        prerenderedRoutes: 400,
        evidencePaths: [
          ".next/prerender-manifest.json",
          ".next/server/app-paths-manifest.json",
        ],
      });
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects a build whose emitted route count exceeds the budget", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "museum-cardinality-"));
    try {
      writeBuildEvidence(root, MAX_PRERENDERED_ROUTES + 1);

      expect(() => readBuildEvidence({ root })).toThrow(
        "Museum build cardinality budget exceeded"
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
