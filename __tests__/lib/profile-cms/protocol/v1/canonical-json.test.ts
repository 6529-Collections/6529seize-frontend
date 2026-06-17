import {
  CanonicalJsonError,
  canonicalizeJson,
} from "@/lib/profile-cms/protocol/v1";

describe("CMS canonical JSON", () => {
  it("sorts object keys and preserves array order", () => {
    expect(canonicalizeJson({ b: 2, a: 1 })).toBe('{"a":1,"b":2}');
    expect(canonicalizeJson([{ z: 1, a: 2 }, "x"])).toBe(
      '[{"a":2,"z":1},"x"]'
    );
  });

  it("rejects values that are not valid canonical JSON inputs", () => {
    expect(() => canonicalizeJson({ a: undefined })).toThrow(
      CanonicalJsonError
    );
    expect(() => canonicalizeJson(Number.POSITIVE_INFINITY)).toThrow(
      CanonicalJsonError
    );
    expect(() => canonicalizeJson(new Date("2026-06-17T00:00:00Z"))).toThrow(
      CanonicalJsonError
    );
  });

  it("rejects cyclic objects", () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;

    expect(() => canonicalizeJson(cyclic)).toThrow(CanonicalJsonError);
  });
});
