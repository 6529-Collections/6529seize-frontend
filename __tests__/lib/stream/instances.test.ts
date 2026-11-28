import { chosenInstance, isInstanceName } from "@/lib/stream/instances";

describe("isInstanceName", () => {
  it("knows only the configured instances", () => {
    expect(isInstanceName("r9")).toBe(true);
    expect(isInstanceName("r8")).toBe(true);
    expect(isInstanceName("r7")).toBe(false);
    expect(isInstanceName(null)).toBe(false);
  });
});

describe("chosenInstance", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    window.localStorage.clear();
  });
  it("defaults to r9", () => {
    expect(chosenInstance()).toBe("r9");
  });
  it("reads a stored older instance", () => {
    window.localStorage.setItem("stream-sepolia-instance", "r8");
    expect(chosenInstance()).toBe("r8");
  });
  it("ignores an unknown stored value", () => {
    window.localStorage.setItem("stream-sepolia-instance", "<script>");
    expect(chosenInstance()).toBe("r9");
  });
  it("falls back when storage throws", () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(chosenInstance()).toBe("r9");
  });
});
