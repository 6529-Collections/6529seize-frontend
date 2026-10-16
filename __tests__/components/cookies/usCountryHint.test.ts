import {
  readUsCountryHint,
  rememberCountryHint,
} from "@/components/cookies/usCountryHint";

const HINT_KEY = "6529:us-country-hint";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("usCountryHint", () => {
  it("has no hint until a completed lookup returned US", () => {
    expect(readUsCountryHint()).toBe(false);
  });

  it.each(["US", " us ", "uS"])("remembers %p as US", (country) => {
    rememberCountryHint(country);

    expect(readUsCountryHint()).toBe(true);
    expect(window.localStorage.getItem(HINT_KEY)).toBe("US");
  });

  it.each(["FR", "", "   ", null, undefined])(
    "clears the hint for %p",
    (country) => {
      rememberCountryHint("US");

      rememberCountryHint(country);

      expect(readUsCountryHint()).toBe(false);
      expect(window.localStorage.getItem(HINT_KEY)).toBeNull();
    }
  );

  it("ignores a stored value that is not the US marker", () => {
    window.localStorage.setItem(HINT_KEY, "FR");

    expect(readUsCountryHint()).toBe(false);
  });

  it("falls back to no hint when reading storage throws", () => {
    window.localStorage.setItem(HINT_KEY, "US");
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });

    expect(readUsCountryHint()).toBe(false);
  });

  it("does not throw when writing or clearing storage fails", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });
    jest.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });

    expect(() => rememberCountryHint("US")).not.toThrow();
    expect(() => rememberCountryHint("FR")).not.toThrow();
  });

  it("works when the localStorage property itself throws", () => {
    jest.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new Error("access denied");
    });

    expect(() => rememberCountryHint("US")).not.toThrow();
    expect(readUsCountryHint()).toBe(false);
  });
});
