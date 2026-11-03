import { shouldHideSubscriptions } from "@/components/user/layout/userPageVisibility";

describe("shouldHideSubscriptions", () => {
  it.each([
    ["US", false],
    [" us ", false],
    ["FR", true],
    ["", true],
    [undefined, true],
    [null, true],
  ] as const)("on iOS with country %p hides: %p", (country, hidden) => {
    expect(shouldHideSubscriptions({ capacitorIsIos: true, country })).toBe(
      hidden
    );
  });

  it("never hides outside iOS", () => {
    expect(
      shouldHideSubscriptions({ capacitorIsIos: false, country: "" })
    ).toBe(false);
    expect(
      shouldHideSubscriptions({ capacitorIsIos: false, country: "FR" })
    ).toBe(false);
  });
});
