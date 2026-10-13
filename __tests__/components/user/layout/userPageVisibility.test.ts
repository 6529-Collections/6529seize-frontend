import {
  isAwaitingIosCountryCheck,
  shouldHideSubscriptions,
} from "@/components/user/layout/userPageVisibility";

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

describe("isAwaitingIosCountryCheck", () => {
  it.each([
    ["iOS while the lookup is pending", true, true, true],
    ["iOS once the lookup settled", true, false, false],
    ["Android or web while the lookup is pending", false, true, false],
    ["Android or web once the lookup settled", false, false, false],
  ] as const)("%s", (_label, capacitorIsIos, isCountryPending, expected) => {
    expect(
      isAwaitingIosCountryCheck({ capacitorIsIos, isCountryPending })
    ).toBe(expected);
  });
});
