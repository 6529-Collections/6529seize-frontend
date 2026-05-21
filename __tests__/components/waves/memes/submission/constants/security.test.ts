import {
  canonicalizeInteractiveMediaUrl,
  isInteractiveMediaContentPathAllowed,
} from "@/components/waves/memes/submission/constants/security";

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

describe("interactive media security helpers", () => {
  it("allows an IPFS root CID path", () => {
    expect(
      isInteractiveMediaContentPathAllowed("ipfs.io", `/ipfs/${CID_V0}`)
    ).toBe(true);
  });

  it("allows nested IPFS HTML paths", () => {
    expect(
      isInteractiveMediaContentPathAllowed(
        "ipfs.io",
        `/ipfs/${CID_V0}/pendulums_mint_script.html`
      )
    ).toBe(true);
  });

  it("allows query params on canonical interactive media URLs", () => {
    expect(
      canonicalizeInteractiveMediaUrl(
        `https://ipfs.io/ipfs/${CID_V0}/pendulums_mint_script.html?seed=374131294`
      )
    ).toBe(
      `https://ipfs.io/ipfs/${CID_V0}/pendulums_mint_script.html?seed=374131294`
    );
  });

  it("rejects nested non-HTML IPFS paths", () => {
    expect(
      isInteractiveMediaContentPathAllowed(
        "ipfs.io",
        `/ipfs/${CID_V0}/image.png`
      )
    ).toBe(false);
  });

  it("rejects IPFS paths with traversal segments", () => {
    expect(
      isInteractiveMediaContentPathAllowed(
        "ipfs.io",
        `/ipfs/${CID_V0}/../index.html`
      )
    ).toBe(false);
  });

  it("rejects IPFS paths with encoded traversal", () => {
    expect(
      canonicalizeInteractiveMediaUrl(
        `https://ipfs.io/ipfs/${CID_V0}/%2e%2e/index.html`
      )
    ).toBeNull();
  });

  it("still rejects URL hashes", () => {
    expect(
      canonicalizeInteractiveMediaUrl(`https://ipfs.io/ipfs/${CID_V0}#hash`)
    ).toBeNull();
  });
});
