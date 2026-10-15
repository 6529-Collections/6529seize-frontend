import { MEMES_CONTRACT } from "@/constants/constants";
import {
  NFT_HTML_IFRAME_SANDBOX,
  getNftHtmlIframeSandbox,
} from "@/lib/media/nft-html-sandbox";

const MEMES_507_SOURCE =
  "https://arweave.net/ZXasOCLe2lF1iR_EcG7iZ628NLWs5vYHh-zBl6zhvVg";

describe("NFT_HTML_IFRAME_SANDBOX", () => {
  const tokens = NFT_HTML_IFRAME_SANDBOX.split(/\s+/);

  it("allows scripts so generative art can run", () => {
    expect(tokens).toContain("allow-scripts");
  });

  it("does not grant same-origin access", () => {
    expect(tokens).not.toContain("allow-same-origin");
  });

  it("does not grant popups, top navigation, forms, modals or downloads", () => {
    expect(tokens).toEqual(["allow-scripts"]);
  });
});

describe("getNftHtmlIframeSandbox", () => {
  it("uses the scripts-only sandbox by default", () => {
    expect(
      getNftHtmlIframeSandbox(
        { contract: MEMES_CONTRACT, id: 1 },
        "https://arweave.net/1YUXdSJtHxXIzFc7REy8zQT-zpTzZLdhoT6TKM34MR4"
      )
    ).toBe(NFT_HTML_IFRAME_SANDBOX);
    expect(getNftHtmlIframeSandbox({ id: 1 }, undefined)).toBe(
      NFT_HTML_IFRAME_SANDBOX
    );
  });

  it("adds same-origin only for the pinned Memes #507 artwork", () => {
    expect(
      getNftHtmlIframeSandbox(
        { contract: MEMES_CONTRACT.toLowerCase(), id: 507 },
        MEMES_507_SOURCE
      )
    ).toBe("allow-scripts allow-same-origin");
  });

  it("does not extend the #507 exception to another token, contract or source", () => {
    expect(
      getNftHtmlIframeSandbox(
        { contract: MEMES_CONTRACT, id: 508 },
        MEMES_507_SOURCE
      )
    ).toBe(NFT_HTML_IFRAME_SANDBOX);
    expect(
      getNftHtmlIframeSandbox(
        { contract: "0x0000000000000000000000000000000000000001", id: 507 },
        MEMES_507_SOURCE
      )
    ).toBe(NFT_HTML_IFRAME_SANDBOX);
    expect(
      getNftHtmlIframeSandbox(
        { contract: MEMES_CONTRACT, id: 507 },
        "https://example.com/replacement.html"
      )
    ).toBe(NFT_HTML_IFRAME_SANDBOX);
  });
});
