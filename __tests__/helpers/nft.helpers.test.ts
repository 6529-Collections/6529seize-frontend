import {
  getAnimationFileTypeFromMetadata,
  getDimensionsFromMetadata,
  getFileTypeFromMetadata,
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
      animation_details: { format: " MP4 " },
      image_details: { format: " PNG " },
    };

    expect(getAnimationFileTypeFromMetadata(metadata)).toBe("MP4");
    expect(getImageFileTypeFromMetadata(metadata)).toBe("PNG");
  });

  it("returns null when no usable media metadata is present", () => {
    expect(getFileTypeFromMetadata({})).toBeNull();
    expect(getDimensionsFromMetadata({})).toBeNull();
  });

  it("returns null for nullish metadata and incomplete dimensions", () => {
    expect(getFileTypeFromMetadata(null)).toBeNull();
    expect(getDimensionsFromMetadata(undefined)).toBeNull();
    expect(
      getDimensionsFromMetadata({
        image_details: { width: 1200 },
      })
    ).toBeNull();
  });
});
