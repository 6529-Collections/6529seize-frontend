import {
  getAnimationDimensionsFromMetadata,
  getAnimationFileTypeFromMetadata,
  getDimensionsFromMetadata,
  getFileTypeFromMetadata,
  getImageDimensionsFromMetadata,
  getImageFileTypeFromMetadata,
} from "@/helpers/nft.helpers";

describe("nft.helpers", () => {
  it("prefers animation format when both media types are present", () => {
    const metadata = {
      animation_details: { format: "MP4", width: 1920, height: 1080 },
      image_details: { format: "PNG", width: 1200, height: 800 },
    };

    expect(getFileTypeFromMetadata(metadata)).toBe("MP4");
    expect(getDimensionsFromMetadata(metadata)).toBe("1,920 x 1,080");
  });

  it("falls back to image metadata when animation details are incomplete", () => {
    const metadata = {
      animation_details: { format: "HTML", width: 1920 },
      image_details: { format: "PNG", width: 1200, height: 800 },
    };

    expect(getFileTypeFromMetadata(metadata)).toBe("HTML");
    expect(getDimensionsFromMetadata(metadata)).toBe("1,200 x 800");
  });

  it("returns media-specific formats safely", () => {
    const metadata = {
      animation_details: { format: " MP4 ", width: 1920, height: 1080 },
      image_details: { format: " PNG ", width: 1200, height: 800 },
    };

    expect(getAnimationFileTypeFromMetadata(metadata)).toBe("MP4");
    expect(getImageFileTypeFromMetadata(metadata)).toBe("PNG");
    expect(getAnimationDimensionsFromMetadata(metadata)).toBe("1,920 x 1,080");
    expect(getImageDimensionsFromMetadata(metadata)).toBe("1,200 x 800");
  });

  it("returns null for empty, whitespace-only, and non-string formats", () => {
    expect(
      getAnimationFileTypeFromMetadata({
        animation_details: { format: "   " },
      })
    ).toBeNull();

    expect(
      getImageFileTypeFromMetadata({
        image_details: { format: "" },
      })
    ).toBeNull();

    expect(
      getAnimationFileTypeFromMetadata({
        animation_details: { format: null as any },
      })
    ).toBeNull();

    expect(
      getImageFileTypeFromMetadata({
        image_details: { format: 123 as any },
      })
    ).toBeNull();
  });

  it("returns null when no usable media metadata is present", () => {
    expect(getFileTypeFromMetadata({})).toBeNull();
    expect(getDimensionsFromMetadata({})).toBeNull();
  });

  it("returns null for nullish metadata and incomplete dimensions", () => {
    expect(getFileTypeFromMetadata(null)).toBeNull();
    expect(getDimensionsFromMetadata(undefined)).toBeNull();
    expect(getAnimationDimensionsFromMetadata(undefined)).toBeNull();
    expect(getImageDimensionsFromMetadata(null)).toBeNull();
    expect(
      getDimensionsFromMetadata({
        image_details: { width: 1200 },
      })
    ).toBeNull();
    expect(
      getAnimationDimensionsFromMetadata({
        animation_details: { width: 1920 },
      })
    ).toBeNull();
  });
});
