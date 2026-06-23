import {
  canonicalizeInteractiveMediaUrl,
  isInteractiveMediaAllowedHost,
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

  it("preserves query params when canonicalizing interactive media URLs", () => {
    expect(
      canonicalizeInteractiveMediaUrl(
        `https://ipfs.io/ipfs/${CID_V0}/pendulums_mint_script.html?seed=374131294`
      )
    ).toBe(
      `https://media.6529.io/ipfs/${CID_V0}/pendulums_mint_script.html?seed=374131294`
    );
  });

  it("preserves URL hashes when canonicalizing interactive media URLs", () => {
    expect(
      canonicalizeInteractiveMediaUrl(
        `https://ipfs.io/ipfs/${CID_V0}/pendulums_mint_script.html?seed=374131294#preview`
      )
    ).toBe(
      `https://media.6529.io/ipfs/${CID_V0}/pendulums_mint_script.html?seed=374131294#preview`
    );
  });

  it("preserves query and hash for native interactive media URLs", () => {
    expect(
      canonicalizeInteractiveMediaUrl(
        `ipfs://${CID_V0}/pendulums_mint_script.html?seed=374131294#preview`
      )
    ).toBe(
      `https://media.6529.io/ipfs/${CID_V0}/pendulums_mint_script.html?seed=374131294#preview`
    );
  });

  it("allows media resolver interactive URLs", () => {
    expect(
      canonicalizeInteractiveMediaUrl(
        `https://media.6529.io/ipfs/${CID_V0}/pendulums_mint_script.html`
      )
    ).toBe(`https://media.6529.io/ipfs/${CID_V0}/pendulums_mint_script.html`);
  });

  it("rejects recognized IPFS subdomain gateways as interactive iframe sources", () => {
    expect(
      canonicalizeInteractiveMediaUrl(
        `https://${CID_SUBDOMAIN}.ipfs.nftstorage.link/pendulums_mint_script.html`
      )
    ).toBeNull();
  });

  it("rejects recognized gateway paths when the host is outside the interactive allowlist", () => {
    expect(isInteractiveMediaAllowedHost("cloudflare-ipfs.com")).toBe(false);
    expect(
      isInteractiveMediaContentPathAllowed(
        "cloudflare-ipfs.com",
        `/ipfs/${CID_V0}/pendulums_mint_script.html`
      )
    ).toBe(false);

    expect(isInteractiveMediaAllowedHost("gateway.pinata.cloud")).toBe(false);
    expect(
      isInteractiveMediaContentPathAllowed(
        "gateway.pinata.cloud",
        `/ipfs/${CID_V0}/pendulums_mint_script.html`
      )
    ).toBe(false);
  });

  it("rejects recognized IPFS subdomain gateway paths in direct path validation", () => {
    expect(
      isInteractiveMediaAllowedHost(`${CID_SUBDOMAIN}.ipfs.nftstorage.link`)
    ).toBe(false);
    expect(
      isInteractiveMediaContentPathAllowed(
        `${CID_SUBDOMAIN}.ipfs.nftstorage.link`,
        "/pendulums_mint_script.html"
      )
    ).toBe(false);
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
      isInteractiveMediaContentPathAllowed(
        "ipfs.io",
        `/ipfs/${CID_V0}/%2e%2e/index.html`
      )
    ).toBe(false);
    expect(
      canonicalizeInteractiveMediaUrl(
        `https://ipfs.io/ipfs/${CID_V0}/%2e%2e/index.html`
      )
    ).toBeNull();
  });

  it("rejects gateway IPFS paths with encoded dot traversal before URL normalization", () => {
    expect(
      canonicalizeInteractiveMediaUrl(
        `https://ipfs.io/ipfs/${CID_V0}/%2e%2e/secret`
      )
    ).toBeNull();
    expect(
      canonicalizeInteractiveMediaUrl(
        `https://ipfs.io/ipfs/${CID_V0}/%2e%2e/${CID_V0}/pendulums_mint_script.html`
      )
    ).toBeNull();
  });

  it("rejects gateway IPFS paths with encoded separators", () => {
    expect(
      isInteractiveMediaContentPathAllowed(
        "ipfs.io",
        `/ipfs/${CID_V0}/%2fsecret.html`
      )
    ).toBe(false);
    expect(
      isInteractiveMediaContentPathAllowed(
        "ipfs.io",
        `/ipfs/${CID_V0}/%5csecret.html`
      )
    ).toBe(false);
    expect(
      canonicalizeInteractiveMediaUrl(
        `https://ipfs.io/ipfs/${CID_V0}/%2fsecret.html`
      )
    ).toBeNull();
    expect(
      canonicalizeInteractiveMediaUrl(
        `https://ipfs.io/ipfs/${CID_V0}/%5csecret.html`
      )
    ).toBeNull();
  });

  it("allows encoded characters in interactive media query params", () => {
    expect(
      canonicalizeInteractiveMediaUrl(
        `https://ipfs.io/ipfs/${CID_V0}/pendulums_mint_script.html?seed=a%2Fb%5Cc`
      )
    ).toBe(
      `https://media.6529.io/ipfs/${CID_V0}/pendulums_mint_script.html?seed=a%2Fb%5Cc`
    );
  });

  it("preserves URL hashes on media resolver interactive URLs", () => {
    expect(
      canonicalizeInteractiveMediaUrl(
        `https://media.6529.io/ipfs/${CID_V0}/pendulums_mint_script.html#render`
      )
    ).toBe(
      `https://media.6529.io/ipfs/${CID_V0}/pendulums_mint_script.html#render`
    );
  });
});
