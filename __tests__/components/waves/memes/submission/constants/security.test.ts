import {
  canonicalizeInteractiveMediaUrl,
  isInteractiveMediaContentPathAllowed,
} from "@/components/waves/memes/submission/constants/security";

const CID_V0 = "QmULf712pVAVBPDBenmE4PGQGA8EWY9uFRiiRmLksfu6Tn";
const CID_SUBDOMAIN =
  "bafybeigdyrztobg3tv6zj5n6xvztf4k5p3xf7r6xkqfq5jz3o5quftdjum";

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

  it("strips query params when canonicalizing interactive media URLs", () => {
    expect(
      canonicalizeInteractiveMediaUrl(
        `https://ipfs.io/ipfs/${CID_V0}/pendulums_mint_script.html?seed=374131294`
      )
    ).toBe(`https://media.6529.io/ipfs/${CID_V0}/pendulums_mint_script.html`);
  });

  it("allows media resolver interactive URLs", () => {
    expect(
      canonicalizeInteractiveMediaUrl(
        `https://media.6529.io/ipfs/${CID_V0}/pendulums_mint_script.html`
      )
    ).toBe(`https://media.6529.io/ipfs/${CID_V0}/pendulums_mint_script.html`);
  });

  it("allows recognized IPFS subdomain gateways", () => {
    expect(
      canonicalizeInteractiveMediaUrl(
        `https://${CID_SUBDOMAIN}.ipfs.nftstorage.link/pendulums_mint_script.html`
      )
    ).toBe(
      `https://media.6529.io/ipfs/${CID_SUBDOMAIN}/pendulums_mint_script.html`
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
