import {
  getGifAnimatedPreviewIssue,
  inspectGifAnimatedPreview,
  parseGifAnimationInfo,
} from "@/components/waves/memes/file-upload/utils/gifAnimationLimits";

const u16 = (value: number) => [value & 0xff, (value >> 8) & 0xff];

/** Builds a minimal GIF with optional global/local color tables. */
const buildGif = ({
  width,
  height,
  frames,
  globalColorTable = false,
  localColorTable = false,
}: {
  readonly width: number;
  readonly height: number;
  readonly frames: number;
  readonly globalColorTable?: boolean;
  readonly localColorTable?: boolean;
}): Uint8Array => {
  const bytes: number[] = [
    ...Array.from("GIF89a", (char) => char.charCodeAt(0)),
    ...u16(width),
    ...u16(height),
    globalColorTable ? 0x80 : 0x00,
    0,
    0,
  ];
  if (globalColorTable) bytes.push(...new Array(6).fill(0));
  // Netscape looping application extension.
  bytes.push(0x21, 0xff, 11, ...Array.from("NETSCAPE2.0", (c) => c.charCodeAt(0)));
  bytes.push(3, 1, 0, 0, 0);
  for (let frame = 0; frame < frames; frame += 1) {
    bytes.push(0x21, 0xf9, 4, 0, 10, 0, 0, 0);
    bytes.push(0x2c, ...u16(0), ...u16(0), ...u16(width), ...u16(height));
    bytes.push(localColorTable ? 0x80 : 0x00);
    if (localColorTable) bytes.push(...new Array(6).fill(0));
    bytes.push(2, 2, 0x4c, 0x01, 0);
  }
  bytes.push(0x3b);
  return Uint8Array.from(bytes);
};

describe("parseGifAnimationInfo", () => {
  it("reads the logical size and counts frames", () => {
    expect(
      parseGifAnimationInfo(buildGif({ width: 3000, height: 4500, frames: 3 }))
    ).toEqual({ width: 3000, height: 4500, frames: 3 });
  });

  it("skips global and local color tables", () => {
    expect(
      parseGifAnimationInfo(
        buildGif({
          width: 10,
          height: 20,
          frames: 2,
          globalColorTable: true,
          localColorTable: true,
        })
      )
    ).toEqual({ width: 10, height: 20, frames: 2 });
  });

  it("returns the frames read before a truncation", () => {
    const gif = buildGif({ width: 10, height: 10, frames: 4 });
    expect(parseGifAnimationInfo(gif.subarray(0, gif.length - 8))?.frames).toBe(
      3
    );
  });

  it("rejects data that is not a GIF", () => {
    expect(parseGifAnimationInfo(new Uint8Array([0x89, 0x50, 0x4e]))).toBeNull();
    expect(
      parseGifAnimationInfo(
        Uint8Array.from([...Array.from("PNGxxx", (c) => c.charCodeAt(0)), ...new Array(10).fill(0)])
      )
    ).toBeNull();
  });
});

describe("getGifAnimatedPreviewIssue", () => {
  it("flags frames above 8,388,608 pixels", () => {
    expect(
      getGifAnimatedPreviewIssue({ width: 3000, height: 4500, frames: 2 })?.kind
    ).toBe("framePixels");
    expect(
      getGifAnimatedPreviewIssue({ width: 2048, height: 4096, frames: 2 })
    ).toBeNull();
  });

  it("flags more than 120 frames", () => {
    expect(
      getGifAnimatedPreviewIssue({ width: 100, height: 100, frames: 121 })?.kind
    ).toBe("frames");
    expect(
      getGifAnimatedPreviewIssue({ width: 100, height: 100, frames: 120 })
    ).toBeNull();
  });

  it("flags more than 268,435,456 pixels across all frames", () => {
    expect(
      getGifAnimatedPreviewIssue({ width: 2048, height: 2048, frames: 65 })
        ?.kind
    ).toBe("totalPixels");
    expect(
      getGifAnimatedPreviewIssue({ width: 2048, height: 2048, frames: 64 })
    ).toBeNull();
  });

  it("ignores single-frame GIFs", () => {
    expect(
      getGifAnimatedPreviewIssue({ width: 5000, height: 5000, frames: 1 })
    ).toBeNull();
  });
});

describe("inspectGifAnimatedPreview", () => {
  const toFile = (bytes: Uint8Array, type: string) => {
    const file = new File([bytes], "art.gif", { type });
    if (typeof file.arrayBuffer !== "function") {
      Object.defineProperty(file, "arrayBuffer", {
        value: async () => bytes.slice().buffer,
      });
    }
    return file;
  };

  it("reports an oversized animated GIF file", async () => {
    await expect(
      inspectGifAnimatedPreview(
        toFile(buildGif({ width: 3000, height: 4500, frames: 2 }), "image/gif")
      )
    ).resolves.toMatchObject({ kind: "framePixels" });
  });

  it("does not inspect other file types", async () => {
    await expect(
      inspectGifAnimatedPreview(
        toFile(buildGif({ width: 3000, height: 4500, frames: 2 }), "image/png")
      )
    ).resolves.toBeNull();
  });
});
