import {
  DEFAULT_MEDIA_RESOLVER_ENDPOINT,
  getDecentralizedMediaFetchUrls,
  hasIsolatedHtmlHosts,
  isFirstPartyMediaHostname,
  isFirstPartyMediaResolverHostname,
  normalizeDecentralizedMediaUrl,
  parseDecentralizedMediaRef,
  resolveDecentralizedMediaInputs,
  toExternalFallbackUrls,
  toIsolatedHtmlUrl,
  toIsolatedHtmlUrlFromInput,
} from "@/lib/media/decentralized-media";

const PREVIOUS_ENDPOINT = "https://media.6529.io";
const CONTENT_DOMAIN_ENDPOINT = "https://media.6529usercontent.com";

const CID_V0 = "QmYMkYKx3Qum7iVHe8jw1qnk8Ep2BdeMUP6Bn4yB4RnSyW";
const CID_V0_AS_V1 =
  "bafybeieu3ufszpka5nyzhlcrf5cceiy6n3ug6fdx7chbntxvmf2p32ryhe";
const CID_V1 = "bafybeigdyrzt5sfp7udm7hu76mjts3sfb44oixwkw55rmpbc6g6wuigv3i";
const TX_ID = "OI6-rpJ2C3Ab4HiZRWt5A1SumhjnYigmSPBPX0ICBj8";

describe("first-party media hosts on both domains", () => {
  it.each([
    [`https://media.6529.io/ipfs/${CID_V1}/a.html`, CID_V1, "a.html"],
    [`https://ipfs.6529.io/ipfs/${CID_V1}/a.html`, CID_V1, "a.html"],
    [`https://ipfs-cache.6529.io/ipfs/${CID_V1}/a.html`, CID_V1, "a.html"],
    [
      `https://media.6529usercontent.com/ipfs/${CID_V1}/a.html`,
      CID_V1,
      "a.html",
    ],
    [`https://media.6529usercontent.com/ipfs/${CID_V0}`, CID_V0, ""],
    [`https://${CID_V1}.ipfs.6529usercontent.com/a.html`, CID_V1, "a.html"],
    [`https://${CID_V1}.ipfs.6529usercontent.com/`, CID_V1, ""],
    [
      `https://${CID_V1}.ipfs.6529usercontent.com/ipfs/${CID_V0}/img.png`,
      CID_V0,
      "img.png",
    ],
  ])("parses %s to the same reference", (input, id, path) => {
    expect(parseDecentralizedMediaRef(input)).toEqual({
      protocol: "ipfs",
      id,
      path,
    });
  });

  it("parses IPNS and Arweave paths on the content-domain path host", () => {
    expect(
      parseDecentralizedMediaRef(
        "https://media.6529usercontent.com/ipns/example.eth/a.png"
      )
    ).toEqual({ protocol: "ipns", id: "example.eth", path: "a.png" });
    expect(
      parseDecentralizedMediaRef(
        `https://media.6529usercontent.com/arweave/${TX_ID}`
      )
    ).toEqual({ protocol: "arweave", id: TX_ID, path: "" });
  });

  it("does not parse per-CID hosts with an invalid label or extra labels", () => {
    expect(
      parseDecentralizedMediaRef("https://not-a-cid.ipfs.6529usercontent.com/")
    ).toBeNull();
    expect(
      parseDecentralizedMediaRef(
        `https://a.${CID_V1}.ipfs.6529usercontent.com/`
      )
    ).toBeNull();
    expect(
      parseDecentralizedMediaRef(`https://6529usercontent.com/ipfs/${CID_V1}`)
    ).toBeNull();
  });

  it("classifies first-party hostnames", () => {
    expect(isFirstPartyMediaResolverHostname("media.6529.io")).toBe(true);
    expect(isFirstPartyMediaResolverHostname("MEDIA.6529usercontent.com.")).toBe(
      true
    );
    expect(isFirstPartyMediaResolverHostname("ipfs.6529.io")).toBe(false);
    expect(isFirstPartyMediaHostname("ipfs.6529.io")).toBe(true);
    expect(isFirstPartyMediaHostname("ipfs-cache.6529.io")).toBe(true);
    expect(isFirstPartyMediaHostname(`${CID_V1}.ipfs.6529usercontent.com`)).toBe(
      true
    );
    expect(isFirstPartyMediaHostname("a.b.ipfs.6529usercontent.com")).toBe(
      false
    );
    expect(isFirstPartyMediaHostname("ipfs.6529usercontent.com")).toBe(false);
    expect(isFirstPartyMediaHostname("6529usercontent.com")).toBe(false);
    expect(isFirstPartyMediaHostname("ipfs.io")).toBe(false);
  });
});

describe("with the previous resolver endpoint", () => {
  it.each([undefined, "", PREVIOUS_ENDPOINT, DEFAULT_MEDIA_RESOLVER_ENDPOINT])(
    "keeps today's URLs for %p",
    (endpoint) => {
      const ref = parseDecentralizedMediaRef(`ipfs://${CID_V0}/a.html`)!;
      expect(hasIsolatedHtmlHosts(endpoint)).toBe(false);
      expect(toIsolatedHtmlUrl(ref, endpoint || undefined, "?seed=1#x")).toBe(
        `https://media.6529.io/ipfs/${CID_V0}/a.html?seed=1#x`
      );
    }
  );

  it("returns HTML inputs unchanged", () => {
    for (const input of [
      `https://media.6529.io/ipfs/${CID_V0}/a.html?seed=1`,
      `https://ipfs.6529.io/ipfs/${CID_V1}`,
      `ipfs://${CID_V1}/a.html`,
      `https://${CID_V1}.ipfs.6529usercontent.com/a.html`,
    ]) {
      expect(toIsolatedHtmlUrlFromInput(input, PREVIOUS_ENDPOINT)).toBe(input);
    }
  });

  it("rewrites content-domain inputs to the previous path host", () => {
    expect(
      normalizeDecentralizedMediaUrl(
        `https://media.6529usercontent.com/ipfs/${CID_V1}/a.png`,
        PREVIOUS_ENDPOINT
      )
    ).toBe(`https://media.6529.io/ipfs/${CID_V1}/a.png`);
    expect(
      normalizeDecentralizedMediaUrl(
        `https://${CID_V1}.ipfs.6529usercontent.com/a.html`,
        PREVIOUS_ENDPOINT
      )
    ).toBe(`https://media.6529.io/ipfs/${CID_V1}/a.html`);
  });

  it("keeps the full fallback list, including the 6529.io path gateway", () => {
    const ref = parseDecentralizedMediaRef(`ipfs://${CID_V1}`)!;
    const withoutEndpoint = toExternalFallbackUrls(ref);
    expect(toExternalFallbackUrls(ref, PREVIOUS_ENDPOINT)).toEqual(
      withoutEndpoint
    );
    expect(withoutEndpoint).toContain(`https://ipfs.6529.io/ipfs/${CID_V1}`);
    expect(
      withoutEndpoint.some((url) => url.includes("6529usercontent"))
    ).toBe(false);
  });
});

describe("with the content-domain resolver endpoint", () => {
  it("detects per-CID hosts only for the exact content-domain origin", () => {
    expect(hasIsolatedHtmlHosts(CONTENT_DOMAIN_ENDPOINT)).toBe(true);
    expect(hasIsolatedHtmlHosts(`${CONTENT_DOMAIN_ENDPOINT}/`)).toBe(true);
    expect(hasIsolatedHtmlHosts(`${CONTENT_DOMAIN_ENDPOINT}:8443`)).toBe(false);
    expect(hasIsolatedHtmlHosts("http://media.6529usercontent.com")).toBe(
      false
    );
    expect(hasIsolatedHtmlHosts("https://media.example.com")).toBe(false);
  });

  it("builds per-CID URLs for IPFS HTML, converting CIDv0", () => {
    const ref = parseDecentralizedMediaRef(`ipfs://${CID_V0}/dir/a b.html`)!;
    expect(toIsolatedHtmlUrl(ref, CONTENT_DOMAIN_ENDPOINT)).toBe(
      `https://${CID_V0_AS_V1}.ipfs.6529usercontent.com/dir/a%20b.html`
    );
    expect(
      toIsolatedHtmlUrl(
        { protocol: "ipfs", id: CID_V1, path: "" },
        CONTENT_DOMAIN_ENDPOINT,
        "?seed=7#frame"
      )
    ).toBe(`https://${CID_V1}.ipfs.6529usercontent.com/?seed=7#frame`);
  });

  it("ignores a suffix that is not a query or hash", () => {
    expect(
      toIsolatedHtmlUrl(
        { protocol: "ipfs", id: CID_V1, path: "" },
        CONTENT_DOMAIN_ENDPOINT,
        "/../other"
      )
    ).toBe(`https://${CID_V1}.ipfs.6529usercontent.com/`);
  });

  it.each([
    [
      "IPNS names",
      { protocol: "ipns" as const, id: "example.eth", path: "a.html" },
      "https://media.6529usercontent.com/ipns/example.eth/a.html",
    ],
    [
      "Arweave transactions",
      { protocol: "arweave" as const, id: TX_ID, path: "" },
      `https://media.6529usercontent.com/arweave/${TX_ID}`,
    ],
    [
      "mixed-case CIDv1",
      {
        protocol: "ipfs" as const,
        id: `bAFY${CID_V1.slice(4)}`,
        path: "a.html",
      },
      `https://media.6529usercontent.com/ipfs/bAFY${CID_V1.slice(4)}/a.html`,
    ],
  ])("falls back to the path host for %s", (_label, ref, expected) => {
    expect(toIsolatedHtmlUrl(ref, CONTENT_DOMAIN_ENDPOINT, "?q=1")).toBe(
      `${expected}?q=1`
    );
  });

  it.each([
    [`https://media.6529.io/ipfs/${CID_V0}/a.html?seed=1#h`],
    [`https://ipfs.6529.io/ipfs/${CID_V0}/a.html?seed=1#h`],
    [`https://ipfs-cache.6529.io/ipfs/${CID_V0}/a.html?seed=1#h`],
    [`https://media.6529usercontent.com/ipfs/${CID_V0}/a.html?seed=1#h`],
    [`https://${CID_V0_AS_V1}.ipfs.6529usercontent.com/a.html?seed=1#h`],
    [`ipfs://${CID_V0}/a.html?seed=1#h`],
  ])("isolates first-party HTML input %s", (input) => {
    expect(toIsolatedHtmlUrlFromInput(input, CONTENT_DOMAIN_ENDPOINT)).toBe(
      `https://${CID_V0_AS_V1}.ipfs.6529usercontent.com/a.html?seed=1#h`
    );
  });

  it("rewrites first-party Arweave input to the content-domain path host", () => {
    expect(
      toIsolatedHtmlUrlFromInput(
        `https://media.6529.io/arweave/${TX_ID}`,
        CONTENT_DOMAIN_ENDPOINT
      )
    ).toBe(`https://media.6529usercontent.com/arweave/${TX_ID}`);
  });

  it("leaves third-party gateways and other URLs unchanged", () => {
    for (const input of [
      `https://ipfs.io/ipfs/${CID_V1}/a.html`,
      `https://arweave.net/${TX_ID}`,
      "https://example.com/a.html",
      `http://media.6529.io/ipfs/${CID_V1}`,
      "not a url",
    ]) {
      expect(toIsolatedHtmlUrlFromInput(input, CONTENT_DOMAIN_ENDPOINT)).toBe(
        input
      );
    }
  });

  it("rewrites previous-host inputs to the content-domain path host", () => {
    for (const input of [
      `https://media.6529.io/ipfs/${CID_V1}/a.png`,
      `https://ipfs.6529.io/ipfs/${CID_V1}/a.png`,
      `https://ipfs-cache.6529.io/ipfs/${CID_V1}/a.png`,
      `ipfs://${CID_V1}/a.png`,
    ]) {
      expect(normalizeDecentralizedMediaUrl(input, CONTENT_DOMAIN_ENDPOINT)).toBe(
        `https://media.6529usercontent.com/ipfs/${CID_V1}/a.png`
      );
    }
  });

  it("uses the path host first and drops the 6529.io path gateway fallback", () => {
    const urls = getDecentralizedMediaFetchUrls(`ipfs://${CID_V1}/a.png`, {
      resolverEndpoint: CONTENT_DOMAIN_ENDPOINT,
    });
    expect(urls[0]).toBe(
      `https://media.6529usercontent.com/ipfs/${CID_V1}/a.png`
    );
    expect(urls).toContain(`https://ipfs.io/ipfs/${CID_V1}/a.png`);
    expect(urls.some((url) => url.includes("6529.io"))).toBe(false);
    expect(urls.some((url) => url.includes(".ipfs.6529usercontent.com"))).toBe(
      false
    );

    const [resolved] = resolveDecentralizedMediaInputs(
      [`https://media.6529.io/ipfs/${CID_V1}`],
      { resolverEndpoint: CONTENT_DOMAIN_ENDPOINT }
    );
    expect(resolved?.resolver_url).toBe(
      `https://media.6529usercontent.com/ipfs/${CID_V1}`
    );
    expect(
      resolved?.external_fallback_urls.some((url) => url.includes("6529.io"))
    ).toBe(false);
  });
});
