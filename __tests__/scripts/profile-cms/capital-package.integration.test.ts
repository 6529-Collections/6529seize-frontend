import fs from "node:fs";
import path from "node:path";

import { validateCmsPackageV1 } from "@/lib/profile-cms/protocol/v1";
import {
  buildMigratedCmsPackage,
  type MigrationManifest,
} from "@/scripts/profile-cms/migrate-static-pages";

const REPO_ROOT = path.join(__dirname, "..", "..", "..");
const MANIFEST_PATH = path.join(
  REPO_ROOT,
  "scripts/profile-cms/manifests/capital.manifest.json"
);
const COMMITTED_FIXTURE_PATH = path.join(
  REPO_ROOT,
  "ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/6529capital.package.json"
);

describe("capital static-page migration package", () => {
  it("regenerates deterministically and validates clean end-to-end", () => {
    const manifest = JSON.parse(
      fs.readFileSync(MANIFEST_PATH, "utf8")
    ) as MigrationManifest;

    const result = buildMigratedCmsPackage(
      manifest,
      REPO_ROOT,
      new Date("2026-07-05T00:00:00.000Z")
    );

    const validation = validateCmsPackageV1(result.cmsPackage, {
      allowFixtureSignatures: true,
      allowFixtureStorage: true,
      enforceHashes: true,
    });

    expect(validation.valid).toBe(true);
    expect(validation.issues).toEqual([]);
    expect(result.cmsPackage.payload.pages).toHaveLength(3);
    expect(result.cmsPackage.payload.routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "/6529capital/index.html" }),
      ])
    );
    // The primary route required by the protocol must exist.
    expect(
      result.cmsPackage.payload.routes.some(
        (route) => route.path === result.cmsPackage.site.base_path
      )
    ).toBe(true);
  });

  it("matches the committed fixture snapshot used as a test asset", () => {
    const manifest = JSON.parse(
      fs.readFileSync(MANIFEST_PATH, "utf8")
    ) as MigrationManifest;
    const committed = JSON.parse(
      fs.readFileSync(COMMITTED_FIXTURE_PATH, "utf8")
    );

    const result = buildMigratedCmsPackage(
      manifest,
      REPO_ROOT,
      new Date(committed.provenance.created_at)
    );

    expect(result.cmsPackage).toEqual(committed);

    const validation = validateCmsPackageV1(committed, {
      allowFixtureSignatures: true,
      allowFixtureStorage: true,
      enforceHashes: true,
    });
    expect(validation.valid).toBe(true);
    expect(validation.issues).toEqual([]);
  });
});
