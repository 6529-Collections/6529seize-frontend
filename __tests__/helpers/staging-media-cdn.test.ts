const mockPublicEnv: { NEXT_PUBLIC_CLOUDFRONT_DOMAIN?: string | undefined } =
  {};

jest.mock("@/config/env", () => ({
  publicEnv: mockPublicEnv,
}));

jest.mock("@/components/ipfs/IPFSContext", () => ({
  resolveIpfsUrlSync: (url: string) => url,
}));

const PROD = "https://d3lqz0a4bldqgf.cloudfront.net";
const STAGING = "https://media.staging.6529.io";

async function loadHelpers() {
  jest.resetModules();
  const image = await import("@/helpers/image.helpers");
  const gif = await import("@/helpers/gif-preview.helpers");
  const video = await import("@/helpers/video.helpers");
  return { ...image, ...gif, ...video };
}

describe("media CDN sizes, GIF previews and renditions per environment", () => {
  afterEach(() => {
    delete mockPublicEnv.NEXT_PUBLIC_CLOUDFRONT_DOMAIN;
  });

  describe.each([`${STAGING}/`, STAGING])(
    "on a build with its own media CDN (staging, configured as %s)",
    (configured) => {
      beforeEach(() => {
        mockPublicEnv.NEXT_PUBLIC_CLOUDFRONT_DOMAIN = configured;
      });

      it("requests sizes from the staging media CDN for staging uploads", async () => {
        const { getScaledImageUri, ImageScale } = await loadHelpers();

        expect(
          getScaledImageUri(
            `${STAGING}/drops/author_1/photo.jpg`,
            ImageScale.AUTOx450
          )
        ).toBe(`${STAGING}/drops/author_1/AUTOx450/photo.jpg`);
      });

      it("keeps requesting sizes of older uploads from the prod CDN", async () => {
        const { getScaledImageUri, ImageScale } = await loadHelpers();

        expect(
          getScaledImageUri(
            `${PROD}/pfp/production/a.webp`,
            ImageScale.W_200_H_200
          )
        ).toBe(`${PROD}/pfp/production/200x200/a.webp`);
      });

      it("versions GIF previews and treats staging drop GIFs as first-party", async () => {
        const { getAnimatedImagePreviewUri, isUploadedDropGif, ImageScale } =
          await loadHelpers();

        expect(
          getAnimatedImagePreviewUri(
            `${STAGING}/drops/x/clip.gif`,
            ImageScale.AUTOx450
          )
        ).toBe(`${STAGING}/drops/x/AUTOx450_gifv2/clip.gif`);
        expect(isUploadedDropGif(`${STAGING}/drops/x/clip.gif`)).toBe(true);
        expect(isUploadedDropGif(`${PROD}/drops/x/clip.gif`)).toBe(true);
      });

      it("builds video renditions on the CDN that holds the original", async () => {
        const { getVideoConversions } = await loadHelpers();

        expect(getVideoConversions(`${STAGING}/drops/foo/bar.mp4`)?.HLS).toBe(
          `${STAGING}/renditions/drops/foo/bar/hls/bar.m3u8`
        );
        expect(getVideoConversions(`${PROD}/drops/foo/bar.mp4`)?.HLS).toBe(
          `${PROD}/renditions/drops/foo/bar/hls/bar.m3u8`
        );
      });

      it("ignores look-alike hosts", async () => {
        const { getScaledImageUri, getVideoConversions, ImageScale } =
          await loadHelpers();
        const lookAlike = `${STAGING}.example.com/drops/photo.jpg`;

        expect(getScaledImageUri(lookAlike, ImageScale.AUTOx450)).toBe(
          lookAlike
        );
        expect(
          getVideoConversions(`${STAGING}.example.com/drops/foo/bar.mp4`)
        ).toBeNull();
      });
    }
  );

  describe("on a build without its own media CDN (prod)", () => {
    it("does not size or convert staging media URLs", async () => {
      const {
        getScaledImageUri,
        getVideoConversions,
        isUploadedDropGif,
        ImageScale,
      } = await loadHelpers();
      const stagingPhoto = `${STAGING}/drops/x/photo.jpg`;

      expect(getScaledImageUri(stagingPhoto, ImageScale.AUTOx450)).toBe(
        stagingPhoto
      );
      expect(getVideoConversions(`${STAGING}/drops/foo/bar.mp4`)).toBeNull();
      expect(isUploadedDropGif(`${STAGING}/drops/x/clip.gif`)).toBe(false);
    });

    it("still sizes and converts prod CDN media", async () => {
      const {
        getScaledImageUri,
        getVideoConversions,
        isUploadedDropGif,
        ImageScale,
      } = await loadHelpers();

      expect(
        getScaledImageUri(`${PROD}/drops/x/photo.jpg`, ImageScale.AUTOx450)
      ).toBe(`${PROD}/drops/x/AUTOx450/photo.jpg`);
      expect(getVideoConversions(`${PROD}/drops/foo/bar.mp4`)?.HLS).toBe(
        `${PROD}/renditions/drops/foo/bar/hls/bar.m3u8`
      );
      expect(isUploadedDropGif(`${PROD}/drops/x/clip.gif`)).toBe(true);
    });
  });
});
