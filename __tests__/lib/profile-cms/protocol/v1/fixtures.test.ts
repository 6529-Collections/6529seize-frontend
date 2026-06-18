import fs from "node:fs";
import path from "node:path";

import {
  cmsPackageSchema,
  validateCmsPackageV1,
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

const VALID_FIXTURE_DIR = path.join(FIXTURE_ROOT, "valid");
const INVALID_FIXTURE_DIR = path.join(FIXTURE_ROOT, "invalid");

describe("CMS Phase 1 fixtures", () => {
  it.each(readFixtureNames(VALID_FIXTURE_DIR))(
    "validates valid fixture %s",
    (fixtureName) => {
      const fixture = readFixture(path.join(VALID_FIXTURE_DIR, fixtureName));
      const result = validateCmsPackageV1(fixture);

      expect(cmsPackageSchema.safeParse(fixture).success).toBe(true);
      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
    }
  );

  it.each([
    {
      file: "missing-signature.package.json",
      code: "signature.required",
      path: "/signatures",
    },
    {
      file: "route-collision.package.json",
      code: "route.duplicate_path",
      path: "/payload/routes",
    },
    {
      file: "unknown-block.package.json",
      code: "block.unknown_type",
      path: "/payload/pages/0/blocks/0/block_type",
    },
  ])("returns expected issue for invalid fixture $file", ({ file, code, path: issuePath }) => {
    const fixture = readFixture(path.join(INVALID_FIXTURE_DIR, file));
    const result = validateCmsPackageV1(fixture);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "error",
          code,
          path: issuePath,
        }),
      ])
    );
  });

  it("rejects fixture signatures and storage in production mode", () => {
    const fixture = readFixture(
      path.join(VALID_FIXTURE_DIR, "minimal-profile-homepage.package.json")
    );
    const result = validateCmsPackageV1(fixture, {
      allowFixtureSignatures: false,
      allowFixtureStorage: false,
    });

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "signature.fixture_not_allowed",
        "storage.fixture_not_allowed",
        "storage.decentralized_receipt_required",
      ])
    );
  });

  it("fails closed on unsafe URL schemes", () => {
    const fixture = readFixture(
      path.join(VALID_FIXTURE_DIR, "minimal-profile-homepage.package.json")
    );
    const unsafeFixture: CmsPackageV1 = {
      ...fixture,
      payload: {
        ...fixture.payload,
        pages: fixture.payload.pages.map((page, index) =>
          index === 0
            ? {
                ...page,
                metadata: {
                  ...page.metadata,
                  canonical_url: "javascript:alert(1)",
                },
              }
            : page
        ),
      },
    };

    const result = validateCmsPackageV1(unsafeFixture);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "page.canonical_url_unsafe_uri",
          path: "/payload/pages/0/metadata/canonical_url",
        }),
      ])
    );
  });

  it("rejects plain HTTP asset URLs", () => {
    const unsafeHttpUri = ["http:", "//169.254.169.254/latest/meta-data"].join(
      ""
    );
    const fixture = readFixture(
      path.join(VALID_FIXTURE_DIR, "minimal-profile-homepage.package.json")
    );
    const unsafeFixture: CmsPackageV1 = {
      ...fixture,
      payload: {
        ...fixture.payload,
        assets: fixture.payload.assets.map((asset, index) =>
          index === 0
            ? {
                ...asset,
                uri: unsafeHttpUri,
              }
            : asset
        ),
      },
    };

    const result = validateCmsPackageV1(unsafeFixture);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "asset.unsafe_uri",
          path: "/payload/assets/0/uri",
        }),
      ])
    );
  });

  it.each([String.raw`/\evil.com`, "/%2Fevil.com", "/%5Cevil.com"])(
    "rejects unsafe relative URL %s",
    (unsafeUrl) => {
      const fixture = readFixture(
        path.join(VALID_FIXTURE_DIR, "minimal-profile-homepage.package.json")
      );
      const unsafeFixture: CmsPackageV1 = {
        ...fixture,
        payload: {
          ...fixture.payload,
          navigation: fixture.payload.navigation.map((navigation, index) =>
            index === 0
              ? {
                  ...navigation,
                  items: [
                    {
                      label: "Unsafe",
                      url: unsafeUrl,
                    },
                  ],
                }
              : navigation
          ),
        },
      };

      const result = validateCmsPackageV1(unsafeFixture);

      expect(result.valid).toBe(false);
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: "navigation.unsafe_url",
            path: "/payload/navigation/0/items/0/url",
          }),
        ])
      );
    }
  );

  it("rejects non-V1 hash strings at schema time", () => {
    const fixture = readFixture(
      path.join(VALID_FIXTURE_DIR, "minimal-profile-homepage.package.json")
    );
    const invalidPrefix = {
      ...fixture,
      integrity: {
        ...fixture.integrity,
        payload_hash:
          "keccak256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      },
    };
    const uppercaseHash = {
      ...fixture,
      integrity: {
        ...fixture.integrity,
        package_hash:
          "sha256:CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
      },
    };

    expect(
      validateCmsPackageV1(invalidPrefix).issues.map((issue) => issue.code)
    ).toEqual(expect.arrayContaining(["hash.invalid"]));
    expect(
      validateCmsPackageV1(uppercaseHash).issues.map((issue) => issue.code)
    ).toEqual(expect.arrayContaining(["hash.invalid"]));
  });

  it("does not report non-enum block_type failures as unknown block types", () => {
    const fixture = readFixture(
      path.join(VALID_FIXTURE_DIR, "minimal-profile-homepage.package.json")
    );
    const invalidBlockType = {
      ...fixture,
      payload: {
        ...fixture.payload,
        pages: fixture.payload.pages.map((page, pageIndex) =>
          pageIndex === 0
            ? {
                ...page,
                blocks: page.blocks.map((block, blockIndex) =>
                  blockIndex === 0
                    ? {
                        ...block,
                        block_type: 123,
                      }
                    : block
                ),
              }
            : page
        ),
      },
    };

    const codes = validateCmsPackageV1(invalidBlockType).issues.map(
      (issue) => issue.code
    );

    expect(codes).toEqual(expect.arrayContaining(["schema.invalid"]));
    expect(codes).not.toEqual(expect.arrayContaining(["block.unknown_type"]));
  });

  it("does not report non-string hash failures as hash string format errors", () => {
    const fixture = readFixture(
      path.join(VALID_FIXTURE_DIR, "minimal-profile-homepage.package.json")
    );
    const invalidHashType = {
      ...fixture,
      integrity: {
        ...fixture.integrity,
        payload_hash: 123,
      },
    };

    const codes = validateCmsPackageV1(invalidHashType).issues.map(
      (issue) => issue.code
    );

    expect(codes).toEqual(expect.arrayContaining(["schema.invalid"]));
    expect(codes).not.toEqual(expect.arrayContaining(["hash.invalid"]));
  });
});

function readFixtureNames(directory: string): string[] {
  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .sort();
}

function readFixture(filePath: string): CmsPackageV1 {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as CmsPackageV1;
}
