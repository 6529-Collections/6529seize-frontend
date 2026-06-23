import {
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_TWITTER_CARD,
  LARGE_IMAGE_TWITTER_CARD,
  SOCIAL_CARD_IMAGE_HEIGHT,
  SOCIAL_CARD_IMAGE_WIDTH,
  getAbsoluteOgImageUrl,
  getAppMetadata,
  getCollectionSocialCardImagePath,
  getDefaultOgImageUrl,
  getLargeSocialCardMetadata,
  getNftSocialCardImagePath,
} from "@/components/providers/metadata";

describe("Metadata functionality (migrated from _document.tsx)", () => {
  describe("Version Meta Tag (core functionality from _document.tsx)", () => {
    it("includes version meta tag in other field when VERSION env var is set", () => {
      jest.resetModules();
      jest.isolateModules(() => {
        const { publicEnv } = require("@/config/env");
        publicEnv.VERSION = "test-version-123";

        const { getAppMetadata } = require("@/components/providers/metadata");
        const metadata = getAppMetadata();

        expect(metadata.other).toEqual({ version: "test-version-123" });
      });
    });

    it("includes empty version when VERSION env var is not set", () => {
      jest.resetModules();
      jest.isolateModules(() => {
        const { publicEnv } = require("@/config/env");
        publicEnv.VERSION = undefined;

        const { getAppMetadata } = require("@/components/providers/metadata");
        const metadata = getAppMetadata();

        expect(metadata.other).toEqual({ version: "" });
      });
    });

    it("maintains version meta tag functionality that was in the old _document.tsx test", () => {
      jest.resetModules();
      jest.isolateModules(() => {
        const { publicEnv } = require("@/config/env");
        publicEnv.VERSION = "test-version";

        const { getAppMetadata } = require("@/components/providers/metadata");
        const metadata = getAppMetadata();

        expect(metadata.other?.version).toBe("test-version");
      });
    });
  });

  describe("Standard Metadata Structure", () => {
    it("includes favicon icon", () => {
      const metadata = getAppMetadata();
      expect(metadata.icons).toEqual({
        icon: "/favicon.ico",
      });
    });

    it("includes open graph metadata with proper structure", () => {
      const metadata = getAppMetadata();

      expect(metadata.openGraph).toBeDefined();
      expect(metadata.openGraph?.type).toBe("website");
      expect(metadata.openGraph?.siteName).toBe("6529.io");
      expect(metadata.openGraph?.images).toBeInstanceOf(Array);
      expect(metadata.openGraph?.images.length).toBeGreaterThan(0);
      expect(metadata.openGraph?.title).toBeDefined();
      expect(metadata.openGraph?.description).toBeDefined();
    });

    it("includes twitter card metadata", () => {
      const metadata = getAppMetadata();

      expect(metadata.twitter).toEqual({
        card: DEFAULT_TWITTER_CARD,
        site: "@6529Collections",
      });
    });

    it("uses 6529.io as the default production title", () => {
      const metadata = getAppMetadata();

      expect(metadata.title).toBe("6529.io");
      expect(metadata.openGraph?.title).toBe("6529.io");
    });

    it("accepts custom metadata overrides", () => {
      const customMetadata = {
        title: "Custom Title",
        description: "Custom Description",
        ogImage: "https://custom.com/image.png",
        twitterCard: "summary_large_image" as const,
      };

      const metadata = getAppMetadata(customMetadata);

      expect(metadata.title).toBe("Custom Title");
      expect(metadata.openGraph?.images).toEqual([
        "https://custom.com/image.png",
      ]);
      expect(metadata.openGraph?.type).toBe("website");
      expect(metadata.openGraph?.siteName).toBe("6529.io");
      expect(metadata.twitter).toEqual({
        card: "summary_large_image",
        site: "@6529Collections",
      });
    });

    it("uses an absolute default Open Graph image URL", () => {
      const metadata = getAppMetadata();

      expect(metadata.openGraph?.images).toEqual([getDefaultOgImageUrl()]);
      expect(getDefaultOgImageUrl("https://6529.io")).toBe(
        "https://6529.io/6529io.png"
      );
      expect(DEFAULT_OG_IMAGE_PATH).toBe("/6529io.png");
    });

    it("normalizes relative Open Graph image paths", () => {
      const image = getAbsoluteOgImageUrl(
        "/api/og-metadata/waves/wave%201",
        "https://6529.io"
      );

      expect(image).toBe("https://6529.io/api/og-metadata/waves/wave%201");
    });

    it("preserves absolute Open Graph image URLs", () => {
      const image = getAbsoluteOgImageUrl(
        "https://cdn.test/card.png",
        "https://6529.io"
      );

      expect(image).toBe("https://cdn.test/card.png");
    });

    it("emits Open Graph image dimensions when provided", () => {
      const metadata = getAppMetadata({
        title: "Profile",
        ogImage: "https://custom.com/profile.png",
        ogImageAlt: "Profile card",
        ogImageHeight: SOCIAL_CARD_IMAGE_HEIGHT,
        ogImageWidth: SOCIAL_CARD_IMAGE_WIDTH,
        twitterCard: LARGE_IMAGE_TWITTER_CARD,
      });

      expect(metadata.openGraph?.images).toEqual([
        {
          url: "https://custom.com/profile.png",
          width: SOCIAL_CARD_IMAGE_WIDTH,
          height: SOCIAL_CARD_IMAGE_HEIGHT,
          alt: "Profile card",
        },
      ]);
    });

    it("builds standard large social-card metadata", () => {
      const metadata = getLargeSocialCardMetadata(
        {
          title: "Wave",
          description: "Waves",
          ogImage: "/api/og-metadata/waves/123",
        },
        "https://6529.io"
      );

      expect(metadata).toEqual({
        title: "Wave",
        description: "Waves",
        ogImage: "https://6529.io/api/og-metadata/waves/123",
        ogImageHeight: SOCIAL_CARD_IMAGE_HEIGHT,
        ogImageWidth: SOCIAL_CARD_IMAGE_WIDTH,
        twitterCard: LARGE_IMAGE_TWITTER_CARD,
      });
    });

    it("builds collection social-card image paths", () => {
      expect(getCollectionSocialCardImagePath("the-memes")).toBe(
        "/api/og-metadata/collections/the-memes"
      );

      expect(
        getCollectionSocialCardImagePath("the memes", {
          badge: "6529",
          image: "/memes-preview.png",
          subtitle: "The Memes by 6529",
          title: "The Memes",
        })
      ).toBe(
        "/api/og-metadata/collections/the%20memes?badge=6529&image=%2Fmemes-preview.png&subtitle=The+Memes+by+6529&title=The+Memes"
      );
    });

    it("builds NFT social-card image paths", () => {
      expect(
        getNftSocialCardImagePath({
          artist: "6529er",
          badge: "The Memes",
          collection: "The Memes",
          contract: "0xabc/def",
          displayId: 42,
          id: "1/2",
          image: "https://cdn.test/image.png",
          subtitle: "The Memes #1 | Collections",
          title: "Seize the Memes",
        })
      ).toBe(
        "/api/og-metadata/nfts/0xabc%2Fdef/1%2F2?artist=6529er&badge=The+Memes&collection=The+Memes&displayId=42&image=https%3A%2F%2Fcdn.test%2Fimage.png&subtitle=The+Memes+%231+%7C+Collections&title=Seize+the+Memes"
      );
    });
  });
});
