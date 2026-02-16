import {
  normalizeCurationDropInput,
  validateCurationDropInput,
} from "@/components/waves/utils/validateCurationDropUrl";

describe("validateCurationDropInput", () => {
  const contract = "0x1234567890abcdef1234567890abcdef12345678";
  const id = "123";
  const user = "artist_99";

  const supportedPaths = [
    `superrare.com/artwork/eth/${contract}/${id}`,
    `transient.xyz/nfts/ethereum/${contract}/${id}`,
    `transient.xyz/mint/${id}`,
    `manifold.xyz/@${user}/id/${id}`,
    `foundation.app/mint/eth/${contract}/${id}`,
    `opensea.io/item/ethereum/${contract}/${id}`,
    `opensea.io/assets/ethereum/${contract}/${id}`,
  ];

  it("accepts all supported URL patterns with https", () => {
    supportedPaths.forEach((path) => {
      expect(validateCurationDropInput(`https://${path}`)).toBeNull();
    });
  });

  it("accepts all supported URL patterns without scheme", () => {
    supportedPaths.forEach((path) => {
      expect(validateCurationDropInput(path)).toBeNull();
    });
  });

  it("accepts all supported URL patterns with www host", () => {
    supportedPaths.forEach((path) => {
      expect(validateCurationDropInput(`https://www.${path}`)).toBeNull();
    });
  });

  it("accepts all supported URL patterns with www host and no scheme", () => {
    supportedPaths.forEach((path) => {
      expect(validateCurationDropInput(`www.${path}`)).toBeNull();
    });
  });

  it("accepts optional trailing slash", () => {
    expect(
      validateCurationDropInput(
        `https://opensea.io/item/ethereum/${contract}/${id}/`
      )
    ).toBeNull();
  });

  it("accepts transient mint slug ids", () => {
    expect(
      validateCurationDropInput(
        "https://www.transient.xyz/mint/paulatim-deinde-subito"
      )
    ).toBeNull();
    expect(
      normalizeCurationDropInput(
        "www.transient.xyz/mint/paulatim-deinde-subito"
      )
    ).toBe("https://www.transient.xyz/mint/paulatim-deinde-subito");
  });

  it("rejects non-url input", () => {
    expect(validateCurationDropInput("not-a-url")).toEqual({
      error: true,
      helperText: "URL must match a supported curation link format.",
    });
  });

  it("rejects url with extra text", () => {
    expect(
      validateCurationDropInput(
        "check this https://opensea.io/item/ethereum/1/2"
      )
    ).toEqual({
      error: true,
      helperText: "Enter URL only (no extra text).",
    });
  });

  it("rejects non-https urls", () => {
    expect(
      validateCurationDropInput(
        `http://opensea.io/item/ethereum/${contract}/${id}`
      )
    ).toEqual({
      error: true,
      helperText: "Enter a valid HTTPS URL.",
    });
  });

  it("rejects unsupported domains", () => {
    expect(validateCurationDropInput(`https://example.com/${id}`)).toEqual({
      error: true,
      helperText: "URL must match a supported curation link format.",
    });
  });

  it("rejects unsupported path format on an allowed domain", () => {
    expect(
      validateCurationDropInput(
        `https://opensea.io/collection/${contract}/${id}`
      )
    ).toEqual({
      error: true,
      helperText: "URL must match a supported curation link format.",
    });
  });

  it("rejects unsupported non-www subdomains", () => {
    expect(
      validateCurationDropInput(
        `https://m.foundation.app/mint/eth/${contract}/${id}`
      )
    ).toEqual({
      error: true,
      helperText: "URL must match a supported curation link format.",
    });
  });

  it("rejects invalid contract segment", () => {
    expect(
      validateCurationDropInput("https://foundation.app/mint/eth/0x1234/12")
    ).toEqual({
      error: true,
      helperText: "URL must match a supported curation link format.",
    });
  });

  it("rejects non-numeric id segment", () => {
    expect(
      validateCurationDropInput(
        `https://superrare.com/artwork/eth/${contract}/abc`
      )
    ).toEqual({
      error: true,
      helperText: "URL must match a supported curation link format.",
    });
  });

  it("rejects query and hash fragments", () => {
    expect(
      validateCurationDropInput(
        `https://opensea.io/item/ethereum/${contract}/${id}?foo=bar`
      )
    ).toEqual({
      error: true,
      helperText: "URL must match a supported curation link format.",
    });
    expect(
      validateCurationDropInput(
        `https://opensea.io/item/ethereum/${contract}/${id}#section`
      )
    ).toEqual({
      error: true,
      helperText: "URL must match a supported curation link format.",
    });
  });

  it("rejects extra path segments", () => {
    expect(
      validateCurationDropInput(
        `https://transient.xyz/mint/${id}/extra-segment`
      )
    ).toEqual({
      error: true,
      helperText: "URL must match a supported curation link format.",
    });
  });
});

describe("normalizeCurationDropInput", () => {
  const contract = "0x1234567890abcdef1234567890abcdef12345678";
  const id = "123";

  it("normalizes scheme-less input to https", () => {
    expect(
      normalizeCurationDropInput(`opensea.io/item/ethereum/${contract}/${id}`)
    ).toBe(`https://opensea.io/item/ethereum/${contract}/${id}`);
  });

  it("keeps www host if provided", () => {
    expect(
      normalizeCurationDropInput(
        `www.foundation.app/mint/eth/${contract}/${id}`
      )
    ).toBe(`https://www.foundation.app/mint/eth/${contract}/${id}`);
  });

  it("returns null for invalid input", () => {
    expect(normalizeCurationDropInput("example.com/not-supported")).toBeNull();
  });
});
