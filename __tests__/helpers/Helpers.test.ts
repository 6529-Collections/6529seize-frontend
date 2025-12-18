import { DateIntervalsSelection } from "@/enums";
import {
  addProtocol,
  areEqualURLS,
  classNames,
  formatAddress,
  formatNumberWithCommasOrDash,
  getDateFilters,
  getRandomColorWithSeed,
  numberWithCommas,
  numberWithCommasFromString,
  parseIpfsUrl,
  parseIpfsUrlToGateway,
  parseNftDescriptionToHtml,
  printMintDate,
} from "@/helpers/Helpers";

describe("Helpers utility functions", () => {
  test("addProtocol adds https scheme when missing", () => {
    expect(addProtocol("example.com")).toBe("https://example.com");
    expect(addProtocol("https://example.com")).toBe("https://example.com");
    expect(addProtocol("")).toBe("");
  });

  test("parseIpfsUrl converts ipfs protocol to gateway url", () => {
    expect(parseIpfsUrl("ipfs://hash")).toBe("https://ipfs.io/ipfs/hash");
    expect(parseIpfsUrl("https://site")).toBe("https://site");
  });

  test("parseIpfsUrlToGateway converts ipfs protocol to cf-ipfs gateway", () => {
    expect(parseIpfsUrlToGateway("ipfs://data")).toBe(
      "https://cf-ipfs.com/ipfs/data"
    );
    expect(parseIpfsUrlToGateway("https://foo")).toBe("https://foo");
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
    return `
      ${mintDate.toLocaleString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })} 
      (${Math.floor(
        (Date.now() - mintDate.getTime()) / (1000 * 60 * 60 * 24)
      )} days ago)
    `;
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
