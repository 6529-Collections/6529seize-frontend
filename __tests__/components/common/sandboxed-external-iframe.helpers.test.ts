import {
  canonicalizeExternalMetadataHtmlUrl,
  canonicalizeExternalMetadataUrl,
  openExternalMetadataUrl,
} from "@/components/common/sandboxed-external-iframe.helpers";

const CID_V0 = "QmULf712pVAVBPDBenmE4PGQGA8EWY9uFRiiRmLksfu6Tn";

jest.mock("@/lib/media/ipfs-gateways", () => ({
  getConfiguredIpfsGatewayHost: () => "ipfs.6529.io",
}));

jest.mock("@/lib/media/arweave-gateways", () => ({
  canonicalizeArweaveGatewayHostname: (hostname: string) =>
    hostname.toLowerCase(),
  isArweaveGatewayRuntimeHost: (hostname: string) =>
    ["arweave.net", "ardrive.net", "gateway.arweave.net"].includes(
      hostname.toLowerCase()
    ),
}));

describe("sandboxed external iframe URL helpers", () => {
  it("canonicalizes HTTPS metadata URLs", () => {
    expect(
      canonicalizeExternalMetadataUrl(
        " https://EXAMPLE.com/media/index.html?seed=1 "
      )
    ).toBe("https://example.com/media/index.html?seed=1");
  });

  it("rejects unsafe external metadata URLs", () => {
    expect(canonicalizeExternalMetadataUrl("")).toBeNull();
    expect(canonicalizeExternalMetadataUrl("http://example.com")).toBeNull();
    expect(canonicalizeExternalMetadataUrl("javascript:alert(1)")).toBeNull();
    expect(
      canonicalizeExternalMetadataUrl("https://user:pass@example.com")
    ).toBeNull();
    expect(
      canonicalizeExternalMetadataUrl("https://example.com:444/index.html")
    ).toBeNull();
    expect(
      canonicalizeExternalMetadataUrl("https://example.com/index.html#hash")
    ).toBeNull();
  });

  it("keeps strict IPFS and Arweave validation for HTML embeds", () => {
    expect(
      canonicalizeExternalMetadataHtmlUrl(
        `https://ipfs.io/ipfs/${CID_V0}/animation.html?seed=1`
      )
    ).toBe(`https://ipfs.io/ipfs/${CID_V0}/animation.html?seed=1`);

    expect(
      canonicalizeExternalMetadataHtmlUrl(
        `https://ipfs.io/ipfs/${CID_V0}/image.png`
      )
    ).toBeNull();
  });

  it("opens canonical URLs with opener and referrer protections", () => {
    const originalOpen = window.open;
    const open = jest.fn();
    window.open = open;

    openExternalMetadataUrl(" https://EXAMPLE.com/media/index.html ");

    expect(open).toHaveBeenCalledWith(
      "https://example.com/media/index.html",
      "_blank",
      "noopener,noreferrer"
    );

    window.open = originalOpen;
  });

  it("does not open invalid URLs", () => {
    const originalOpen = window.open;
    const open = jest.fn();
    window.open = open;

    openExternalMetadataUrl("javascript:alert(1)");

    expect(open).not.toHaveBeenCalled();

    window.open = originalOpen;
  });
});
