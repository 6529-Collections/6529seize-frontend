import {
  getApiAccessPath,
  getApiAccessReturnPath,
} from "@/services/auth/api-access-redirect";

function returnFromGate(target: string, hash = "") {
  const accessUrl = new URL(getApiAccessPath(target), "https://6529.io");
  return getApiAccessReturnPath(accessUrl.search, hash);
}

describe("API access return destination", () => {
  it("retains the requested path, query and fragment", () => {
    const path = "/the-memes?tab=activity&label=one%20two";
    const gate = new URL(getApiAccessPath(path, "#details"), "https://6529.io");
    expect(gate.searchParams.get("returnTo")).toBe(path);
    expect(getApiAccessReturnPath(gate.search, gate.hash)).toBe(
      path + "#details"
    );
  });

  it("restores the fragment the browser inherited from the HTTP redirect", () => {
    expect(returnFromGate("/the-memes?tab=activity", "#details")).toBe(
      "/the-memes?tab=activity#details"
    );
  });

  it("keeps path-like fragments separate from the destination and query", () => {
    expect(
      returnFromGate("/the-memes?tab=activity", "//example.com?tab=chat")
    ).toBe("/the-memes?tab=activity#//example.com?tab=chat");
  });

  it("falls back to home for a direct visit", () => {
    expect(getApiAccessReturnPath("", "")).toBe("/");
  });

  it.each([
    "https://example.com/the-memes",
    "//example.com",
    "/\\example.com",
    "/x/..//example.com",
    "javascript:alert(1)",
    "/access?returnTo=%2Fwaves",
    "/foo/../restricted",
    "/%61ccess/",
    "/restricted/child",
  ])("rejects the return destination %s", (target) => {
    expect(returnFromGate(target)).toBe("/");
  });
});
