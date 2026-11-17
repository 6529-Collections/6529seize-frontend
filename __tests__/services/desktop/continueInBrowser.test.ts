/**
 * @jest-environment-options {"url": "http://localhost:6529/validator/authorize?x=1#draft=abc"}
 */
import {
  continueInBrowser,
  getWebsiteHost,
} from "@/services/desktop/continueInBrowser";
import { getDesktopShellApi } from "@/helpers/desktop-shell";

jest.mock("@/helpers/desktop-shell", () => ({ getDesktopShellApi: jest.fn() }));
jest.mock("@/config/env", () => ({
  publicEnv: { BASE_ENDPOINT: "https://6529.io" },
}));

describe("continueInBrowser", () => {
  afterEach(() => {
    globalThis.history.replaceState(
      null,
      "",
      "/validator/authorize?x=1#draft=abc"
    );
  });

  it("opens the validator session page with its draft on the website", () => {
    const openExternal = jest.fn();
    jest.mocked(getDesktopShellApi).mockReturnValue({ openExternal } as never);
    expect(continueInBrowser()).toBe(true);
    expect(openExternal).toHaveBeenCalledWith(
      "https://6529.io/validator/authorize?x=1#draft=abc"
    );
  });

  it("carries only the path for other pages", () => {
    const openExternal = jest.fn();
    jest.mocked(getDesktopShellApi).mockReturnValue({ openExternal } as never);
    globalThis.history.replaceState(null, "", "/the-memes/1?token=secret#x");
    expect(continueInBrowser()).toBe(true);
    expect(openExternal).toHaveBeenCalledWith("https://6529.io/the-memes/1");
  });

  it("names the website's host for copy", () => {
    expect(getWebsiteHost()).toBe("6529.io");
  });

  it("does nothing outside 6529 Desktop", () => {
    jest.mocked(getDesktopShellApi).mockReturnValue(null);
    expect(continueInBrowser()).toBe(false);
  });

  it("reports a shell that could not open the page", () => {
    jest.mocked(getDesktopShellApi).mockReturnValue({
      openExternal: () => {
        throw new Error("blocked");
      },
    } as never);
    expect(continueInBrowser()).toBe(false);
  });
});
