jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import { isSafeSourceRoot } from "@/lib/public-review/solidityReferenceValidationPrimitives.server";

describe("Solidity reference validation primitives", () => {
  it("accepts canonical relative source roots", () => {
    expect(isSafeSourceRoot("smart-contracts")).toBe(true);
    expect(isSafeSourceRoot("lib/vendor")).toBe(true);
  });

  it.each([".", "..", "../contracts", "/contracts", "a//b", "a/", "a\\b"])(
    "rejects non-canonical source root %s",
    (root) => {
      expect(isSafeSourceRoot(root)).toBe(false);
    }
  );
});
