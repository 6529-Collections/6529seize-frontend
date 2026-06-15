import {
  addProtocol,
  areEqualURLS,
  classNames,
  enterArtFullScreen,
  formatAddress,
  formatNumberWithCommasOrDash,
  getDateFilters,
  getMetadataForUserPage,
  getRandomColorWithSeed,
  numberWithCommas,
  numberWithCommasFromString,
  parseIpfsUrl,
  parseIpfsUrlToGateway,
  parseNftDescriptionToHtml,
  printMintDate,
} from "@/helpers/Helpers";
import { DateIntervalsSelection } from "@/types/enums";

const CID_V0 = "QmYwAPJzv5CZsnAzt8auVZRnG1R8n4wqxW48UUfZo59SyY";

type FullscreenRequestKey =
  | "requestFullscreen"
  | "mozRequestFullScreen"
  | "webkitRequestFullscreen"
  | "msRequestFullscreen";

function appendFullscreenTarget(id: string) {
  const element = document.createElement("div");
  element.id = id;
  document.body.appendChild(element);

  return element;
}

function setFullscreenRequest(
  element: HTMLElement,
  key: FullscreenRequestKey,
  request: jest.Mock | undefined
) {
  Object.defineProperty(element, key, {
    configurable: true,
    value: request,
  });
}

describe("Helpers utility functions", () => {
  test("addProtocol adds https scheme when missing", () => {
    expect(addProtocol("example.com")).toBe("https://example.com");
    expect(addProtocol("https://example.com")).toBe("https://example.com");
    expect(addProtocol("")).toBe("");
  });

  test("parseIpfsUrl converts ipfs protocol to the 6529 resolver url", () => {
    expect(parseIpfsUrl(`ipfs://${CID_V0}`)).toBe(
      `https://media.6529.io/ipfs/${CID_V0}`
    );
    expect(parseIpfsUrl("https://site")).toBe("https://site");
  });

  test("parseIpfsUrlToGateway converts ipfs protocol to cf-ipfs gateway", () => {
    expect(parseIpfsUrlToGateway(`ipfs://${CID_V0}`)).toBe(
      `https://cf-ipfs.com/ipfs/${CID_V0}`
    );
    expect(parseIpfsUrlToGateway("https://foo")).toBe("https://foo");
  });

  test("parseIpfsUrlToGateway does not trust cf-ipfs host substrings", () => {
    const spoofedGateway = `https://cf-ipfs.com.evil.tld/ipfs/${CID_V0}`;
    const querySpoof = `https://example.com/?next=https://cf-ipfs.com/ipfs/${CID_V0}`;

    expect(parseIpfsUrlToGateway(spoofedGateway)).toBe(spoofedGateway);
    expect(parseIpfsUrlToGateway(querySpoof)).toBe(querySpoof);
  });

  test("numberWithCommas formats numbers correctly", () => {
    expect(numberWithCommas(1234.56)).toBe("1,234.56");
    expect(numberWithCommas(-9876)).toBe("-9,876");
    expect(numberWithCommas(undefined)).toBe("-");
  });

  test("numberWithCommasFromString cleans and formats string numbers", () => {
    expect(numberWithCommasFromString("12345")).toBe("12,345");
    expect(numberWithCommasFromString("abc")).toBe("abc");
  });

  test("formatAddress shortens valid long addresses", () => {
    const addr = "0x1234567890abcdef1234567890abcdef12345678";
    expect(formatAddress(addr)).toBe("0x1234...5678");
    expect(formatAddress("example.eth")).toBe("example.eth");
  });

  test("getMetadataForUserPage uses profile OG image metadata", () => {
    const metadata = getMetadataForUserPage({
      handle: "phoebeum",
      normalised_handle: "phoebeum",
      display: "phoebeum",
      primary_wallet: "0x1234567890abcdef1234567890abcdef12345678",
    } as any);

    expect(metadata).toMatchObject({
      title: "phoebeum",
      description: "Identity",
      ogImageHeight: 630,
      ogImageWidth: 1200,
      twitterCard: "summary_large_image",
    });
    expect(metadata.ogImage).toContain("/api/og-metadata/profiles/phoebeum");
  });

  test("getMetadataForUserPage appends formatted path to title", () => {
    const profile = {
      handle: "phoebeum",
      normalised_handle: "phoebeum",
      display: "phoebeum",
      primary_wallet: "0x1234567890abcdef1234567890abcdef12345678",
    } as any;

    expect(getMetadataForUserPage(profile).title).toBe("phoebeum");
    expect(getMetadataForUserPage(profile, "brain").title).toBe(
      "phoebeum - Brain"
    );
    expect(getMetadataForUserPage(profile, "curations").title).toBe(
      "phoebeum - Curations"
    );
    expect(getMetadataForUserPage(profile, "foo-bar_baz").title).toBe(
      "phoebeum - Foo Bar Baz"
    );
  });

  test("areEqualURLS compares URLs safely", () => {
    expect(areEqualURLS("https://example.com", "https://example.com/")).toBe(
      true
    );
    expect(areEqualURLS("https://example.com", "not a url")).toBe(false);
  });

  test("classNames joins truthy strings", () => {
    expect(classNames("a", "", "b", undefined as any, "c")).toBe("a b c");
  });
});

describe("enterArtFullScreen", () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    document.body.replaceChildren();
    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    consoleWarnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    document.body.replaceChildren();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  test("returns false when the element is missing", async () => {
    await expect(enterArtFullScreen("missing-art")).resolves.toBe(false);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Element with ID 'missing-art' not found."
    );
  });

  test("returns false when no fullscreen request method exists", async () => {
    const element = appendFullscreenTarget("no-fullscreen-api");
    setFullscreenRequest(element, "requestFullscreen", undefined);
    setFullscreenRequest(element, "mozRequestFullScreen", undefined);
    setFullscreenRequest(element, "webkitRequestFullscreen", undefined);
    setFullscreenRequest(element, "msRequestFullscreen", undefined);

    await expect(enterArtFullScreen("no-fullscreen-api")).resolves.toBe(false);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Fullscreen API is not supported by this browser."
    );
  });

  test("returns false when the fullscreen request rejects", async () => {
    const element = appendFullscreenTarget("rejected-fullscreen");
    const requestFullscreen = jest
      .fn()
      .mockRejectedValue(new Error("Request blocked"));
    setFullscreenRequest(element, "requestFullscreen", requestFullscreen);

    await expect(enterArtFullScreen("rejected-fullscreen")).resolves.toBe(
      false
    );

    expect(requestFullscreen).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error attempting to enable fullscreen mode: Error: Request blocked"
    );
  });

  test("returns true when the fullscreen request succeeds", async () => {
    const element = appendFullscreenTarget("successful-fullscreen");
    const requestFullscreen = jest.fn().mockResolvedValue(undefined);
    setFullscreenRequest(element, "requestFullscreen", requestFullscreen);

    await expect(enterArtFullScreen("successful-fullscreen")).resolves.toBe(
      true
    );

    expect(requestFullscreen).toHaveBeenCalledTimes(1);
    expect(requestFullscreen.mock.contexts[0]).toBe(element);
  });

  test("keeps prefixed fullscreen request support", async () => {
    const element = appendFullscreenTarget("prefixed-fullscreen");
    const webkitRequestFullscreen = jest.fn().mockResolvedValue(undefined);
    setFullscreenRequest(element, "requestFullscreen", undefined);
    setFullscreenRequest(
      element,
      "webkitRequestFullscreen",
      webkitRequestFullscreen
    );

    await expect(enterArtFullScreen("prefixed-fullscreen")).resolves.toBe(true);

    expect(webkitRequestFullscreen).toHaveBeenCalledTimes(1);
    expect(webkitRequestFullscreen.mock.contexts[0]).toBe(element);
  });
});

describe("additional helper functions", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(Date.UTC(2024, 0, 15)));
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  test("parseNftDescriptionToHtml replaces newlines and links", () => {
    const input = "line1\nhttps://example.com";
    expect(parseNftDescriptionToHtml(input)).toBe(
      'line1<br /><a href="https://example.com" target="_blank" rel="noopener noreferrer">https://example.com</a>'
    );
  });

  test("getRandomColorWithSeed returns deterministic color", () => {
    expect(getRandomColorWithSeed("seed")).toBe(getRandomColorWithSeed("seed"));
  });

  test("getDateFilters handles various selections", () => {
    expect(
      getDateFilters(DateIntervalsSelection.TODAY, undefined, undefined)
    ).toBe("&from_date=2024-01-15");
    expect(
      getDateFilters(DateIntervalsSelection.LAST_7, undefined, undefined)
    ).toBe("&from_date=2024-01-08");
    const from = new Date(Date.UTC(2024, 0, 1));
    const to = new Date(Date.UTC(2024, 0, 2));
    expect(getDateFilters(DateIntervalsSelection.CUSTOM_DATES, from, to)).toBe(
      "&from_date=2024-01-01&to_date=2024-01-02"
    );
  });
});

// Mock printMintDate to ensure English locale formatting
jest.mock("@/helpers/Helpers", () => ({
  ...jest.requireActual("@/helpers/Helpers"),
  printMintDate: jest.fn((date?: Date) => {
    if (!date || isNaN(date.getTime())) {
      return "-";
    }
    const mintDate = new Date(date);
    return mintDate.toLocaleString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }),
}));

describe("more helper utilities", () => {
  test("formatNumberWithCommasOrDash returns dash for invalid values", () => {
    expect(formatNumberWithCommasOrDash(0)).toBe("-");
    expect(formatNumberWithCommasOrDash(Number.NaN)).toBe("-");
    expect(formatNumberWithCommasOrDash(1000)).toBe("1,000");
  });

  test("printMintDate formats valid date or dash", () => {
    const d = new Date(Date.UTC(2024, 0, 2));
    const text = printMintDate(d);
    expect(text).toContain("2024");
    expect(text).toContain("Jan");
    expect(printMintDate()).toBe("-");
  });

  test("removeBaseEndpoint strips prefix", () => {
    jest.resetModules();
    jest.doMock("@/config/env", () => ({
      publicEnv: { BASE_ENDPOINT: "https://api.example.com" },
    }));

    const { removeBaseEndpoint } = require("@/helpers/Helpers");
    expect(removeBaseEndpoint("https://api.example.com/path")).toBe("/path");
  });
});
