jest.mock("@/config/env", () => {
  const actual = jest.requireActual("@/config/env");
  return {
    ...actual,
    publicEnv: {
      ...actual.publicEnv,
      BASE_ENDPOINT: "https://example.com",
      MEDIA_RESOLVER_ENDPOINT: "https://media.resolver.example/resolve",
    },
  };
});

jest.mock("@/lib/media/decentralized-media", () => {
  const actual = jest.requireActual("@/lib/media/decentralized-media");
  return {
    ...actual,
    getMediaResolverHostname: jest.fn(actual.getMediaResolverHostname),
  };
});

import { publicEnv } from "@/config/env";
import { getMediaResolverHostname } from "@/lib/media/decentralized-media";
import { getLinkPreviewImageSrc } from "@/components/waves/open-graph-preview/previewImage";

const mutableEnv = publicEnv as { MEDIA_RESOLVER_ENDPOINT: string | undefined };

describe("getLinkPreviewImageSrc media resolver host", () => {
  it("loads resolver images directly and parses the resolver endpoint once", () => {
    const resolverImage = "https://media.resolver.example/ipfs/abc.png";

    expect(getLinkPreviewImageSrc(resolverImage)).toBe(resolverImage);
    expect(getLinkPreviewImageSrc(`${resolverImage}?v=2`)).toBe(
      `${resolverImage}?v=2`
    );
    expect(getLinkPreviewImageSrc("https://other.example/a.png")).toMatch(
      /^\/api\/og-metadata\/image\?/
    );
    expect(getMediaResolverHostname).toHaveBeenCalledTimes(1);
  });

  it("follows a changed resolver endpoint", () => {
    const previous = mutableEnv.MEDIA_RESOLVER_ENDPOINT;
    mutableEnv.MEDIA_RESOLVER_ENDPOINT = "https://next.resolver.example/";
    try {
      const nextImage = "https://next.resolver.example/ipfs/abc.png";
      expect(getLinkPreviewImageSrc(nextImage)).toBe(nextImage);
      expect(
        getLinkPreviewImageSrc("https://media.resolver.example/ipfs/abc.png")
      ).toMatch(/^\/api\/og-metadata\/image\?/);
    } finally {
      mutableEnv.MEDIA_RESOLVER_ENDPOINT = previous;
    }
  });
});
