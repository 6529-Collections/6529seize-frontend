/** @jest-environment node */
import { expectUrlState } from "../../tests/support/urlState";

const target = (url: URL) =>
  url.pathname === "/punk6529/collected" &&
  url.searchParams.get("page") === "2" &&
  url.searchParams.get("distribution-page") === "2" &&
  url.hash === "#distribution-memes-1";

describe("Browser URL state", () => {
  it("accepts the exact route, query and anchor without page-load APIs", async () => {
    await expect(
      expectUrlState(
        {
          url: () =>
            "https://6529.io/punk6529/collected?distribution-page=2&page=2#distribution-memes-1",
        },
        target
      )
    ).resolves.toBeUndefined();
  });

  it("waits for client navigation to update the URL", async () => {
    // The first sample is always the previous URL, independent of timer load.
    const url = jest
      .fn()
      .mockReturnValueOnce("https://6529.io/punk6529/collected?page=1")
      .mockReturnValue(
        "https://6529.io/punk6529/collected?page=2&distribution-page=2#distribution-memes-1"
      );
    await expect(expectUrlState({ url }, target)).resolves.toBeUndefined();
    expect(url.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("includes a caller's route description in timeout failures", async () => {
    await expect(
      expectUrlState({ url: () => "https://6529.io/waves" }, target, {
        timeout: 25,
        message: "Expected the distribution return URL and anchor",
      })
    ).rejects.toThrow("Expected the distribution return URL and anchor");
  });

  it.each([
    "/punk6529?distribution-page=2&page=2#distribution-memes-1",
    "/punk6529/collected?distribution-page=2&page=3#distribution-memes-1",
    "/punk6529/collected?distribution-page=3&page=2#distribution-memes-1",
    "/punk6529/collected?distribution-page=2&page=2#distribution-memes-2",
  ])("rejects incorrect route state: %s", async (path) => {
    await expect(
      expectUrlState({ url: () => `https://6529.io${path}` }, target, {
        timeout: 25,
      })
    ).rejects.toThrow(path);
  });
});
