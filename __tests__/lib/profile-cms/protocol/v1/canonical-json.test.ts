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

  it("sorts astral-plane keys by UTF-16 code units", () => {
    const astralKey = String.fromCodePoint(0x1f4a9);
    const privateUseKey = String.fromCodePoint(0xe000);

    expect(canonicalizeJson({ [privateUseKey]: "bmp", [astralKey]: "astral" }))
      .toBe(
        `{${JSON.stringify(astralKey)}:"astral",${JSON.stringify(
          privateUseKey
        )}:"bmp"}`
      );
  });

  it("serializes numeric edge cases with ECMAScript JSON number rules", () => {
    const roundedFixtureNumber = Number("333333333.33333329");

    expect(
      canonicalizeJson([-0, 5e21, 1e-7, roundedFixtureNumber, 9007199254740991])
    ).toBe("[0,5e+21,1e-7,333333333.3333333,9007199254740991]");
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
