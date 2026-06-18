import fs from "node:fs";
import path from "node:path";

import {
  computeCmsPackageHash,
  computeCmsPayloadHash,
  hashCanonicalJson,
  validateCmsPackageV1,
  withComputedCmsHashes,
  type CmsPackageV1,
} from "@/lib/profile-cms/protocol/v1";

const FIXTURE_ROOT = path.join(
  process.cwd(),
  "ops",
  "workstreams",
  "profile-native-cms-roadmap",
  "phase-1",
  "fixtures"
);

describe("CMS hash helpers", () => {
  it("matches the canonical object ordering vector", () => {
    expect(hashCanonicalJson({ b: 2, a: 1 })).toBe(
      "sha256:43258cff783fe7036d8a43033f830adfc60ec037382473548ac742b888292777"
    );
  });

  it("matches the unicode string vector", () => {
    expect(hashCanonicalJson({ title: "6529 Museum" })).toBe(
      "sha256:3c518ebe06d42949bc66db07f8ea911d1fbf5f75e06e998df4ef34bbc38f0b81"
    );
  });

  it("computes enforceable payload and package hashes", () => {
    const fixture = withComputedCmsHashes(
      readFixture("valid/minimal-profile-homepage.package.json")
    );

    expect(computeCmsPayloadHash(fixture.payload)).toBe(
      fixture.integrity.payload_hash
    );
    expect(computeCmsPackageHash(fixture)).toBe(fixture.integrity.package_hash);

    expect(validateCmsPackageV1(fixture, { enforceHashes: true }).valid).toBe(
      true
    );
  });

  it("detects payload mutation after hashes are computed", () => {
    const fixture = withComputedCmsHashes(
      readFixture("valid/minimal-profile-homepage.package.json")
    );
    const mutated: CmsPackageV1 = {
      ...fixture,
      payload: {
        ...fixture.payload,
        pages: fixture.payload.pages.map((page, index) =>
          index === 0
            ? {
                ...page,
                metadata: {
                  ...page.metadata,
                  title: "mutated title",
                },
              }
            : page
        ),
      },
    };

    const result = validateCmsPackageV1(mutated, { enforceHashes: true });

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "integrity.payload_hash_mismatch",
        "integrity.package_hash_mismatch",
      ])
    );
  });

  it("excludes signatures and storage receipts from package hash input", () => {
    const fixture = withComputedCmsHashes(
      readFixture("valid/minimal-profile-homepage.package.json")
    );
    const mutatedEnvelopes: CmsPackageV1 = {
      ...fixture,
      signatures: [
        {
          ...fixture.signatures[0]!,
          signature: "fixture-signature-mutated",
        },
      ],
      storage: [
        {
          ...fixture.storage[0]!,
          provider_content_id: "bafyfixturemutated",
        },
      ],
    };
    const mutatedContent: CmsPackageV1 = {
      ...fixture,
      site: {
        ...fixture.site,
        title: "mutated site title",
      },
    };

    expect(computeCmsPackageHash(mutatedEnvelopes)).toBe(
      fixture.integrity.package_hash
    );
    expect(computeCmsPackageHash(mutatedContent)).not.toBe(
      fixture.integrity.package_hash
    );
  });
});

function readFixture(relativePath: string): CmsPackageV1 {
  return JSON.parse(
    fs.readFileSync(path.join(FIXTURE_ROOT, relativePath), "utf8")
  ) as CmsPackageV1;
}
