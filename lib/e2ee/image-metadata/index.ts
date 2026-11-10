import {
  type ContainerDescription,
  type FormatStripper,
  sameStream,
} from "./container";
import { gifStripper } from "./gif";
import { jpegStripper } from "./jpeg";
import { pngStripper } from "./png";
import { webpStripper } from "./webp";

/**
 * Photos in encrypted chats are encrypted on the sender's device, so the
 * server never sees them and cannot remove identifying metadata the way it
 * does for ordinary uploads. This applies the same policy before encryption,
 * without re-encoding: EXIF beyond Orientation, XMP, IPTC, comments, text
 * chunks, timestamps, embedded thumbnails and trailing data are removed;
 * pixels, ICC colour profiles, HDR colour chunks (PNG cICP, mDCv, cLLi) and
 * animation are kept byte for byte.
 *
 * Covered: JPEG, PNG (including APNG), WebP and GIF, recognised by their
 * bytes. Anything else (HEIC, AVIF, TIFF, BMP, ...) and anything that does
 * not parse cleanly is returned unchanged.
 */

type ImageFormat = "jpeg" | "png" | "webp" | "gif";

const STRIPPERS: Record<ImageFormat, FormatStripper> = {
  jpeg: jpegStripper,
  png: pngStripper,
  webp: webpStripper,
  gif: gifStripper,
};

function sniffFormat(bytes: Uint8Array): ImageFormat | null {
  const at = (index: number) => bytes[index];
  if (at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) {
    return "jpeg";
  }
  if (at(0) === 0x89 && at(1) === 0x50 && at(2) === 0x4e && at(3) === 0x47) {
    return "png";
  }
  const tag = (start: number) =>
    String.fromCodePoint(...bytes.subarray(start, start + 4));
  if (bytes.length >= 12 && tag(0) === "RIFF" && tag(8) === "WEBP") {
    return "webp";
  }
  return tag(0) === "GIF8" ? "gif" : null;
}

const FORMAT_MIME: Record<ImageFormat, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/**
 * The MIME type of a JPEG, PNG, WebP or GIF recognised by its bytes, or
 * null: pickers can report an empty or generic type for real photos.
 */
export function sniffImageMime(bytes: Uint8Array): string | null {
  const format = sniffFormat(bytes);
  return format === null ? null : FORMAT_MIME[format];
}

/** Same size, orientation and render stream, and nothing identifying left. */
const preserved = (
  before: ContainerDescription,
  after: ContainerDescription
): boolean =>
  after.metadataBlocks.length === 0 &&
  before.width === after.width &&
  before.height === after.height &&
  before.orientation === after.orientation &&
  sameStream(before.render, after.render);

/**
 * The image without identifying metadata, or the input itself (same
 * object) when the format is not covered, nothing needed removing, or the
 * result could not be verified. Never throws.
 */
export function stripImageMetadata(input: Uint8Array): Uint8Array {
  const format = sniffFormat(input);
  if (format === null) {
    return input;
  }
  const stripper = STRIPPERS[format];
  try {
    const before = stripper.describe(input);
    if (before.metadataBlocks.length === 0) {
      return input;
    }
    const output = stripper.strip(input);
    return preserved(before, stripper.describe(output)) ? output : input;
  } catch {
    return input;
  }
}

const IMAGE_EXTENSIONS: Readonly<Record<string, string>> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/apng": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/bmp": "bmp",
  "image/tiff": "tif",
  "image/svg+xml": "svg",
};

/**
 * A neutral name for an image attachment ("image.jpg", then "image-2.jpg"
 * for the second image of a message), so the original file name (often a
 * date, a place or a device name) is not sent. Null for anything that is
 * not an image: other files keep their names.
 */
export function neutralImageName(mime: string, imageNumber = 1): string | null {
  const type = mime.toLowerCase().split(";")[0]?.trim() ?? "";
  if (!type.startsWith("image/")) {
    return null;
  }
  const base = imageNumber > 1 ? `image-${imageNumber}` : "image";
  const extension = IMAGE_EXTENSIONS[type];
  return extension ? `${base}.${extension}` : base;
}
