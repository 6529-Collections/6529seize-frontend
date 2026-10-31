import {
  CUSTOM_LICENSE,
  EMPTY_DETAILS,
  toDeployRequest,
  validateDetails,
} from "@/components/stream/federated/launchForm";

const filled = { ...EMPTY_DETAILS, name: "Harbor Studio", symbol: "HARBOR" };

describe("the launch wizard's details step", () => {
  it("asks for a name and a symbol", () => {
    expect(validateDetails("ERC721", EMPTY_DETAILS)).toEqual({
      name: "stream.launch.error.nameRequired",
      symbol: "stream.launch.error.symbolRequired",
    });
    expect(validateDetails("ERC721", filled)).toEqual({});
  });

  it("limits the name and the symbol's shape", () => {
    expect(
      validateDetails("ERC721", {
        ...filled,
        name: "x".repeat(65),
        symbol: "har bor",
      })
    ).toEqual({
      name: "stream.launch.error.nameLong",
      symbol: "stream.launch.error.symbolFormat",
    });
    expect(
      validateDetails("ERC721", { ...filled, symbol: "ABCDEFGHIJKL" })
    ).toEqual({ symbol: "stream.launch.error.symbolFormat" });
  });

  it("derives a pair's editions name and symbol, and keeps the symbols apart", () => {
    expect(toDeployRequest("PAIR", filled)).toEqual({
      form: "PAIR",
      name: "Harbor Studio",
      symbol: "HARBOR",
      editionName: "Harbor Studio Editions",
      editionSymbol: "HARBORE",
      defaultLicense: "CC0-1.0",
    });
    expect(
      validateDetails("PAIR", { ...filled, editionSymbol: "HARBOR" })
    ).toEqual({ editionSymbol: "stream.launch.error.symbolSame" });
    expect(
      validateDetails("PAIR", { ...filled, symbol: "ELEVENCHARS" })
    ).toEqual({ editionSymbol: "stream.launch.error.symbolFormat" });
  });

  it("accepts any SPDX ID or LicenseRef as another license", () => {
    const custom = { ...filled, license: CUSTOM_LICENSE };
    expect(validateDetails("ERC1155", custom)).toEqual({
      customLicense: "stream.launch.error.licenseFormat",
    });
    expect(
      validateDetails("ERC1155", { ...custom, customLicense: "MIT" })
    ).toEqual({});
    expect(
      toDeployRequest("ERC1155", {
        ...custom,
        customLicense: " LicenseRef-Harbor-1.0 ",
      }).defaultLicense
    ).toBe("LicenseRef-Harbor-1.0");
    expect(
      validateDetails("ERC1155", { ...custom, customLicense: "My license" })
    ).toEqual({ customLicense: "stream.launch.error.licenseFormat" });
  });
});
