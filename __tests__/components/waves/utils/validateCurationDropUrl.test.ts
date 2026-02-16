import { validateCurationDropInput } from "@/components/waves/utils/validateCurationDropUrl";

describe("validateCurationDropInput", () => {
  it("returns null for supported marketplace URLs", () => {
    expect(
      validateCurationDropInput("https://superrare.com/artwork/example")
    ).toBeNull();
    expect(
      validateCurationDropInput("https://manifold.xyz/@artist/id/123")
    ).toBeNull();
    expect(
      validateCurationDropInput("https://opensea.io/item/ethereum/1/2")
    ).toBeNull();
    expect(
      validateCurationDropInput("https://transient.xyz/nfts/ethereum/1/2")
    ).toBeNull();
    expect(
      validateCurationDropInput("https://foundation.app/mint/eth/1/2")
    ).toBeNull();
  });

  it("allows subdomains for supported domains", () => {
    expect(
      validateCurationDropInput("https://www.opensea.io/item/ethereum/1/2")
    ).toBeNull();
    expect(
      validateCurationDropInput("https://m.foundation.app/mint/eth/1/2")
    ).toBeNull();
  });

  it("rejects non-url input", () => {
    expect(validateCurationDropInput("not-a-url")).toEqual({
      error: true,
      helperText: "Enter a valid HTTPS URL.",
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
      validateCurationDropInput("http://opensea.io/item/ethereum/1/2")
    ).toEqual({
      error: true,
      helperText: "Enter a valid HTTPS URL.",
    });
  });

  it("rejects unsupported domains", () => {
    expect(validateCurationDropInput("https://example.com/abc")).toEqual({
      error: true,
      helperText:
        "URL must be from superrare.com, manifold.xyz, opensea.io, transient.xyz, or foundation.app.",
    });
  });
});
