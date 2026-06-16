import { canonicalizeCmsJson } from "@/lib/cms/canonicalize";
import {
  assertCmsPackageHashes,
  getCmsPayloadHash,
  hashCmsJson,
  parseCmsPackage,
} from "@/lib/cms/package-utils";
import { cmsFixturePackages } from "@/lib/cms/fixtures";

describe("CMS package canonicalization", () => {
  it("sorts object keys recursively without changing array order", () => {
    const left = {
      z: 1,
      a: [{ b: true, a: "first" }, "second"],
    };
    const right = {
      a: [{ a: "first", b: true }, "second"],
      z: 1,
    };

    expect(canonicalizeCmsJson(left)).toBe(canonicalizeCmsJson(right));
    expect(canonicalizeCmsJson(left)).toBe(
      '{"a":[{"a":"first","b":true},"second"],"z":1}'
    );
  });

  it("rejects unsupported JSON values", () => {
    expect(() => canonicalizeCmsJson({ bad: Number.NaN })).toThrow(
      "non-finite number"
    );
    expect(() => canonicalizeCmsJson({ bad: new Date() })).toThrow(
      "unsupported value"
    );
  });

  it("hashes fixture payloads and packages deterministically", () => {
    const cmsPackage = cmsFixturePackages.gallery;

    expect(getCmsPayloadHash(cmsPackage.payload)).toBe(cmsPackage.payload_hash);
    expect(hashCmsJson(cmsPackage.payload)).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(() => assertCmsPackageHashes(cmsPackage)).not.toThrow();
  });

  it("validates fixture package schema", () => {
    expect(
      parseCmsPackage(cmsFixturePackages.transaction).payload.page.title
    ).toBe("Transaction That Reads Like English");
  });
});
