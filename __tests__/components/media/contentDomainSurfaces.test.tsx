import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SandboxedExternalIframe from "@/components/common/SandboxedExternalIframe";
import NFTHTMLRenderer from "@/components/nft-image/renderers/NFTHTMLRenderer";
import type { BaseRendererProps } from "@/components/nft-image/types/renderer-props";
import { getHtmlMediaGatewayFallbackUrls } from "@/components/nft-image/utils/gateway-fallback";
import { getDropForgeStorageLocationInfo } from "@/components/drop-forge/drop-forge-storage-location.helpers";
import { getOpenableMediaUrl } from "@/components/drop-forge/craft/craft-claim-helpers";
import { canPreviewAttachmentInline } from "@/components/drops/view/item/content/attachments/DropAttachmentDisplay.view";
import { resolveTrustedEmbedAssetUrl } from "@/components/profile-cms/site-renderer/data";
import { getSafeExternalUrl } from "@/components/the-memes/MemePageAdditionalDetails";
import TimelineMedia, { MediaType } from "@/components/timeline/TimelineMedia";
import {
  canonicalizeInteractiveMediaUrl,
  isInteractiveMediaAllowedHost,
  isInteractiveMediaContentPathAllowed,
} from "@/components/waves/memes/submission/constants/security";
import { ProposalCardPreview } from "@/components/waves/memes/submission/components/ProposalCardPreview";
import { getLinkPreviewImageSrc } from "@/components/waves/open-graph-preview/previewImage";
import type { BaseNFT } from "@/entities/INFT";
import { getOpenableUrl } from "@/helpers/open-url.helpers";
import { processTokenUriMetadata } from "@/services/alchemy/utils";
import type { CmsAssetV1 } from "@/lib/profile-cms/protocol/v1";

const PREVIOUS_ENDPOINT = "https://media.6529.io";
const CONTENT_DOMAIN_ENDPOINT = "https://media.6529usercontent.com";

type EndpointHolder = { mediaResolverEndpointForTest?: string };

// Read at call time (and at import time by module-level constants), so each
// test can switch the configured endpoint.
jest.mock("@/config/env", () => {
  const actual = jest.requireActual("@/config/env");
  return {
    ...actual,
    publicEnv: new Proxy(actual.publicEnv, {
      get: (target, key) =>
        key === "MEDIA_RESOLVER_ENDPOINT"
          ? ((globalThis as EndpointHolder).mediaResolverEndpointForTest ??
            Reflect.get(target, key))
          : Reflect.get(target, key),
    }),
  };
});

jest.mock("@/components/timeline/Timeline.module.css", () => ({
  timelineMediaImage: "media",
}));

jest.mock("@/components/nft-image/NFTImageBalance", () => ({
  __esModule: true,
  default: () => null,
}));

const CID_V0 = "QmYMkYKx3Qum7iVHe8jw1qnk8Ep2BdeMUP6Bn4yB4RnSyW";
const CID_V0_AS_V1 =
  "bafybeieu3ufszpka5nyzhlcrf5cceiy6n3ug6fdx7chbntxvmf2p32ryhe";
const CID_V1 = "bafybeigdyrzt5sfp7udm7hu76mjts3sfb44oixwkw55rmpbc6g6wuigv3i";
const TX_ID = "OI6-rpJ2C3Ab4HiZRWt5A1SumhjnYigmSPBPX0ICBj8";
const ISOLATED = `https://${CID_V0_AS_V1}.ipfs.6529usercontent.com`;

function setEndpoint(endpoint: string) {
  (globalThis as EndpointHolder).mediaResolverEndpointForTest = endpoint;
}

beforeEach(() => {
  setEndpoint(PREVIOUS_ENDPOINT);
});

function nftWithAnimation(animation: string): BaseRendererProps["nft"] {
  return {
    id: 1,
    contract: "0x0000000000000000000000000000000000000001",
    name: "Artwork",
    image: "https://example.com/image.png",
    animation,
    metadata: { animation, animation_url: animation },
  } as unknown as BaseNFT;
}

function renderNftHtml(animation: string) {
  return render(
    <NFTHTMLRenderer
      nft={nftWithAnimation(animation)}
      id="nft-frame"
      height={300}
      heightStyle=""
      imageStyle=""
      bgStyle=""
      showBalance={false}
    />
  );
}

function renderSandboxedFrame(src: string) {
  const original = globalThis.IntersectionObserver;
  // Without an observer the frame renders immediately.
  delete (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;
  try {
    return render(<SandboxedExternalIframe src={src} title="Artwork" />);
  } finally {
    globalThis.IntersectionObserver = original;
  }
}

function renderTimelineHtml(url: string) {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <TimelineMedia url={url} type={MediaType.HTML} label="Animation" />
    </QueryClientProvider>
  );
}

function cmsAsset(uri: string): CmsAssetV1 {
  return {
    id: "asset",
    kind: "html",
    uri,
    mime_type: "text/html",
  } as unknown as CmsAssetV1;
}

describe("with the previous resolver endpoint, outputs are unchanged", () => {
  it("keeps interactive media on media.6529.io", () => {
    expect(
      canonicalizeInteractiveMediaUrl(
        `https://ipfs.io/ipfs/${CID_V0}/a.html?seed=1#h`
      )
    ).toBe(`https://media.6529.io/ipfs/${CID_V0}/a.html?seed=1#h`);
    expect(canonicalizeInteractiveMediaUrl(`ipfs://${CID_V0}/a.html?s=1`)).toBe(
      `https://media.6529.io/ipfs/${CID_V0}/a.html?s=1`
    );
  });

  it("frames sandboxed interactive media from the canonical URL", () => {
    const { container } = renderSandboxedFrame(
      `https://media.6529.io/ipfs/${CID_V0}/a.html?seed=1`
    );
    const frame = container.querySelector("iframe");
    expect(frame).toHaveAttribute(
      "src",
      `https://media.6529.io/ipfs/${CID_V0}/a.html?seed=1`
    );
    expect(frame).toHaveAttribute("sandbox", "allow-scripts");
  });

  it("frames NFT HTML from the resolver first, then the same fallbacks", () => {
    expect(getHtmlMediaGatewayFallbackUrls(`ipfs://${CID_V0}`)[0]).toBe(
      `https://media.6529.io/ipfs/${CID_V0}`
    );
    renderNftHtml(`ipfs://${CID_V0}`);
    expect(document.querySelector("iframe")).toHaveAttribute(
      "src",
      `https://media.6529.io/ipfs/${CID_V0}`
    );
  });

  it("frames timeline HTML from the recorded URL", () => {
    const url = `https://media.6529.io/ipfs/${CID_V0}/a.html`;
    const { container } = renderTimelineHtml(url);
    expect(container.querySelector("iframe")).toHaveAttribute("src", url);
  });

  it("opens and embeds first-party media on the resolver path host", () => {
    expect(getOpenableUrl(`ipfs://${CID_V0}/a.html`)).toBe(
      `https://media.6529.io/ipfs/${CID_V0}/a.html`
    );
    expect(getOpenableUrl(`https://media.6529.io/ipfs/${CID_V0}`)).toBe(
      `https://media.6529.io/ipfs/${CID_V0}`
    );
    expect(getSafeExternalUrl(`ipfs://${CID_V0}/a.html`)).toBe(
      `https://media.6529.io/ipfs/${CID_V0}/a.html`
    );
    expect(getDropForgeStorageLocationInfo(CID_V0)).toEqual(
      expect.objectContaining({
        openUrl: `https://media.6529.io/ipfs/${CID_V0}`,
        copyValue: `https://media.6529.io/ipfs/${CID_V0}`,
      })
    );
    expect(resolveTrustedEmbedAssetUrl(cmsAsset(`ipfs://${CID_V0}/a.html`))).toBe(
      `https://media.6529.io/ipfs/${CID_V0}/a.html`
    );
  });

  it("puts proposal-card HTML on the resolver path host", () => {
    const { container } = render(
      <ProposalCardPreview
        mediaUrl={`ipfs://${CID_V0}/a.html`}
        mimeType="text/html"
        title="Artwork"
        layout="portrait"
      />
    );
    expect(container.querySelector("iframe")?.getAttribute("srcdoc")).toContain(
      `src="https://media.6529.io/ipfs/${CID_V0}/a.html"`
    );
  });

  it("resolves token artwork on media.6529.io", () => {
    const image = (value: string) =>
      processTokenUriMetadata({ image: value })?.imageUrl;
    expect(image(`ipfs://${CID_V1}/a.png`)).toBe(
      `https://media.6529.io/ipfs/${CID_V1}/a.png`
    );
    // Previous hosts and third-party gateways stay exactly as stored.
    expect(image(`https://ipfs.6529.io/ipfs/${CID_V1}/a.png?v=1`)).toBe(
      `https://ipfs.6529.io/ipfs/${CID_V1}/a.png?v=1`
    );
    expect(image(`https://media.6529.io/ipfs/${CID_V1}/a.png?v=1`)).toBe(
      `https://media.6529.io/ipfs/${CID_V1}/a.png?v=1`
    );
    expect(image(`https://arweave.net/${TX_ID}`)).toBe(
      `https://arweave.net/${TX_ID}`
    );
    // Content-domain inputs are rewritten to the configured host.
    expect(image(`https://media.6529usercontent.com/ipfs/${CID_V1}/a.png`)).toBe(
      `https://media.6529.io/ipfs/${CID_V1}/a.png`
    );
    expect(image(`https://${CID_V1}.ipfs.6529usercontent.com/a.png`)).toBe(
      `https://media.6529.io/ipfs/${CID_V1}/a.png`
    );
    expect(image("https://not-a-cid.ipfs.6529usercontent.com/a.png")).toBeNull();
  });

  it("opens stored Drop Forge media unchanged", () => {
    for (const url of [
      `https://media.6529.io/ipfs/${CID_V0}/a.html?seed=1`,
      `https://ipfs.6529.io/ipfs/${CID_V0}/a.html`,
      "https://example.com/a.html",
    ]) {
      expect(getOpenableMediaUrl(url)).toBe(url);
    }
    expect(getOpenableMediaUrl(`ipfs://${CID_V0}/a.html`)).toBe(
      `https://media.6529.io/ipfs/${CID_V0}/a.html`
    );
  });

  it("understands content-domain URLs as first-party input", () => {
    expect(
      canonicalizeInteractiveMediaUrl(
        `https://media.6529usercontent.com/ipfs/${CID_V0}/a.html`
      )
    ).toBe(`https://media.6529.io/ipfs/${CID_V0}/a.html`);
    expect(
      canonicalizeInteractiveMediaUrl(
        `https://${CID_V1}.ipfs.6529usercontent.com/a.html?seed=2`
      )
    ).toBe(`https://media.6529.io/ipfs/${CID_V1}/a.html?seed=2`);
    expect(
      resolveTrustedEmbedAssetUrl(
        cmsAsset(`https://${CID_V1}.ipfs.6529usercontent.com/a.html`)
      )
    ).toBe(`https://media.6529.io/ipfs/${CID_V1}/a.html`);
    expect(
      canPreviewAttachmentInline(
        `https://media.6529usercontent.com/ipfs/${CID_V1}/a.pdf`
      )
    ).toBe(true);
    expect(
      getLinkPreviewImageSrc(
        `https://media.6529usercontent.com/ipfs/${CID_V1}/a.png`
      )
    ).toBe(`https://media.6529usercontent.com/ipfs/${CID_V1}/a.png`);
  });
});

describe("with the content-domain resolver endpoint", () => {
  beforeEach(() => {
    setEndpoint(CONTENT_DOMAIN_ENDPOINT);
  });

  it("canonicalizes interactive media to the content-domain path host", () => {
    for (const input of [
      `https://ipfs.io/ipfs/${CID_V0}/a.html?seed=1#h`,
      `https://media.6529.io/ipfs/${CID_V0}/a.html?seed=1#h`,
      `ipfs://${CID_V0}/a.html?seed=1#h`,
    ]) {
      expect(canonicalizeInteractiveMediaUrl(input)).toBe(
        `https://media.6529usercontent.com/ipfs/${CID_V0}/a.html?seed=1#h`
      );
    }
  });

  it("frames sandboxed interactive media on its per-CID host with the same sandbox", () => {
    const { container } = renderSandboxedFrame(
      `https://media.6529.io/ipfs/${CID_V0}/a.html?seed=1`
    );
    const frame = container.querySelector("iframe");
    expect(frame).toHaveAttribute("src", `${ISOLATED}/a.html?seed=1`);
    expect(frame).toHaveAttribute("sandbox", "allow-scripts");
    expect(frame).toHaveAttribute("referrerpolicy", "no-referrer");
  });

  it("keeps Arweave interactive media on the path host", () => {
    const { container } = renderSandboxedFrame(`ar://${TX_ID}`);
    expect(container.querySelector("iframe")).toHaveAttribute(
      "src",
      `https://media.6529usercontent.com/arweave/${TX_ID}`
    );
  });

  it("frames NFT HTML on its per-CID host, then the path host and fallbacks", () => {
    const urls = getHtmlMediaGatewayFallbackUrls(`ipfs://${CID_V0}`);
    expect(urls.slice(0, 2)).toEqual([
      `${ISOLATED}/`,
      `https://media.6529usercontent.com/ipfs/${CID_V0}`,
    ]);
    expect(urls.some((url) => url.includes("6529.io"))).toBe(false);
    renderNftHtml(`ipfs://${CID_V0}`);
    expect(document.querySelector("iframe")).toHaveAttribute(
      "src",
      `${ISOLATED}/`
    );
  });

  it("frames first-party timeline HTML on its per-CID host", () => {
    const { container } = renderTimelineHtml(
      `https://media.6529.io/ipfs/${CID_V0}/a.html`
    );
    expect(container.querySelector("iframe")).toHaveAttribute(
      "src",
      `${ISOLATED}/a.html`
    );
  });

  it("keeps third-party timeline HTML on its recorded URL", () => {
    const url = `https://ipfs.io/ipfs/${CID_V0}/a.html`;
    const { container } = renderTimelineHtml(url);
    expect(container.querySelector("iframe")).toHaveAttribute("src", url);
  });

  it("opens first-party media on its per-CID host", () => {
    expect(getOpenableUrl(`ipfs://${CID_V0}/a.html`)).toBe(`${ISOLATED}/a.html`);
    expect(getOpenableUrl(`https://ipfs.6529.io/ipfs/${CID_V0}/a.html?x=1`)).toBe(
      `${ISOLATED}/a.html?x=1`
    );
    expect(getOpenableUrl("https://example.com/a.html")).toBe(
      "https://example.com/a.html"
    );
    expect(getSafeExternalUrl(`ipfs://${CID_V0}/a.html`)).toBe(
      `${ISOLATED}/a.html`
    );
    expect(getSafeExternalUrl(`ar://${TX_ID}`)).toBe(
      `https://media.6529usercontent.com/arweave/${TX_ID}`
    );
    expect(getDropForgeStorageLocationInfo(CID_V0)).toEqual(
      expect.objectContaining({
        openUrl: `${ISOLATED}/`,
        copyValue: `https://media.6529usercontent.com/ipfs/${CID_V0}`,
      })
    );
  });

  it("embeds profile-site HTML on its per-CID host and still refuses other hosts", () => {
    for (const uri of [
      `ipfs://${CID_V0}/a.html`,
      `https://media.6529.io/ipfs/${CID_V0}/a.html`,
      `https://media.6529usercontent.com/ipfs/${CID_V0}/a.html`,
      `https://${CID_V0_AS_V1}.ipfs.6529usercontent.com/a.html`,
    ]) {
      expect(resolveTrustedEmbedAssetUrl(cmsAsset(uri))).toBe(
        `${ISOLATED}/a.html`
      );
    }
    expect(resolveTrustedEmbedAssetUrl(cmsAsset("https://example.com/a.html"))).toBe(
      null
    );
    expect(
      resolveTrustedEmbedAssetUrl(
        cmsAsset("https://not-a-cid.ipfs.6529usercontent.com/a.html")
      )
    ).toBe(null);
  });

  it("puts proposal-card HTML on its per-CID host and images on the path host", () => {
    const html = render(
      <ProposalCardPreview
        mediaUrl={`ipfs://${CID_V0}/a.html`}
        mimeType="text/html"
        title="Artwork"
        layout="portrait"
      />
    );
    expect(html.container.querySelector("iframe")?.getAttribute("srcdoc")).toContain(
      `src="${ISOLATED}/a.html"`
    );
    html.unmount();

    const image = render(
      <ProposalCardPreview
        mediaUrl={`ipfs://${CID_V0}/a.png`}
        mimeType="image/png"
        title="Artwork"
        layout="portrait"
      />
    );
    expect(image.container.querySelector("iframe")?.getAttribute("srcdoc")).toContain(
      `src="https://media.6529usercontent.com/ipfs/${CID_V0}/a.png"`
    );
  });

  it("allows both domains' hosts for interactive media and keeps path checks", () => {
    expect(isInteractiveMediaAllowedHost("media.6529.io")).toBe(true);
    expect(isInteractiveMediaAllowedHost("media.6529usercontent.com")).toBe(true);
    expect(
      isInteractiveMediaAllowedHost(`${CID_V1}.ipfs.6529usercontent.com`)
    ).toBe(true);
    expect(isInteractiveMediaAllowedHost("not-a-cid.ipfs.6529usercontent.com")).toBe(
      false
    );
    expect(isInteractiveMediaAllowedHost("6529usercontent.com")).toBe(false);
    expect(isInteractiveMediaAllowedHost("evil.example")).toBe(false);
    expect(
      isInteractiveMediaContentPathAllowed(
        `${CID_V1}.ipfs.6529usercontent.com`,
        "/index.html"
      )
    ).toBe(true);
    expect(
      isInteractiveMediaContentPathAllowed(
        `${CID_V1}.ipfs.6529usercontent.com`,
        "/script.js"
      )
    ).toBe(false);
    expect(
      isInteractiveMediaContentPathAllowed(
        `${CID_V1}.ipfs.6529usercontent.com`,
        "/a%2f..%2fb.html"
      )
    ).toBe(false);
  });

  it("resolves token artwork on the content-domain path host", () => {
    const image = (value: string) =>
      processTokenUriMetadata({ image: value })?.imageUrl;
    for (const input of [
      `ipfs://${CID_V1}/a.png`,
      `https://media.6529usercontent.com/ipfs/${CID_V1}/a.png`,
      `https://media.6529.io/ipfs/${CID_V1}/a.png`,
      `https://ipfs.6529.io/ipfs/${CID_V1}/a.png`,
      `https://${CID_V1}.ipfs.6529usercontent.com/a.png`,
    ]) {
      expect(image(input)).toBe(
        `https://media.6529usercontent.com/ipfs/${CID_V1}/a.png`
      );
    }
    expect(image(`https://arweave.net/${TX_ID}`)).toBe(
      `https://arweave.net/${TX_ID}`
    );
  });

  it("opens stored Drop Forge media on its per-CID host", () => {
    for (const url of [
      `https://media.6529.io/ipfs/${CID_V0}/a.html?seed=1`,
      `https://ipfs.6529.io/ipfs/${CID_V0}/a.html?seed=1`,
    ]) {
      expect(getOpenableMediaUrl(url)).toBe(`${ISOLATED}/a.html?seed=1`);
    }
    // Native URIs resolve through the path host first, which drops the query
    // as it does today.
    expect(getOpenableMediaUrl(`ipfs://${CID_V0}/a.html?seed=1`)).toBe(
      `${ISOLATED}/a.html`
    );
    expect(getOpenableMediaUrl(`https://media.6529.io/arweave/${TX_ID}`)).toBe(
      `https://media.6529usercontent.com/arweave/${TX_ID}`
    );
    expect(getOpenableMediaUrl("https://example.com/a.html")).toBe(
      "https://example.com/a.html"
    );
  });

  it("treats both media hosts as first-party for previews and images", () => {
    for (const host of ["media.6529.io", "media.6529usercontent.com"]) {
      expect(canPreviewAttachmentInline(`https://${host}/ipfs/${CID_V1}/a.pdf`)).toBe(
        true
      );
    }
    expect(
      canPreviewAttachmentInline(
        `https://${CID_V1}.ipfs.6529usercontent.com/a.pdf`
      )
    ).toBe(false);
    expect(canPreviewAttachmentInline("https://example.com/a.pdf")).toBe(false);
  });
});

describe("with another resolver endpoint", () => {
  const OTHER_ENDPOINT = "https://resolver.example.test";

  beforeEach(() => {
    setEndpoint(OTHER_ENDPOINT);
  });

  it("keeps interactive media on media.6529.io, as before", () => {
    expect(canonicalizeInteractiveMediaUrl(`ipfs://${CID_V0}/a.html`)).toBe(
      `https://media.6529.io/ipfs/${CID_V0}/a.html`
    );
    expect(
      canonicalizeInteractiveMediaUrl(
        `https://ipfs.io/ipfs/${CID_V0}/a.html?seed=1`
      )
    ).toBe(`https://media.6529.io/ipfs/${CID_V0}/a.html?seed=1`);
    expect(isInteractiveMediaAllowedHost("media.6529.io")).toBe(true);
    expect(isInteractiveMediaAllowedHost("resolver.example.test")).toBe(false);
  });

  it("checks interactive previews against media.6529.io, as before", () => {
    jest.isolateModules(() => {
      const security = jest.requireActual<
        typeof import("@/components/waves/memes/submission/constants/security")
      >("@/components/waves/memes/submission/constants/security");
      expect(security.INTERACTIVE_MEDIA_GATEWAY_BASE_URL).toEqual({
        ipfs: "https://media.6529.io/ipfs/",
        arweave: "https://media.6529.io/arweave/",
      });
    });
  });
});
