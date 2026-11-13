/**
 * Recognises served media formats from a file's leading bytes, and markup
 * that a browser would render as a page or image document.
 */

const JPEG = "image/jpeg";
const MPEG_AUDIO = "audio/mpeg";
const QUICKTIME = "video/quicktime";
const MP4 = "video/mp4";
const HEIC = "image/heic";
const AVIF = "image/avif";

/** Leading bytes needed by the checks below (ISO brand lists, markup). */
export const MEDIA_SIGNATURE_BYTE_COUNT = 64;

/** Served media types and the extension a saved file of that type gets. */
const EXTENSION_BY_TYPE: ReadonlyMap<string, string> = new Map([
  ["image/png", "png"],
  [JPEG, "jpg"],
  ["image/gif", "gif"],
  ["image/webp", "webp"],
  [AVIF, "avif"],
  [HEIC, "heic"],
  ["image/heif", "heif"],
  ["image/bmp", "bmp"],
  [MP4, "mp4"],
  [QUICKTIME, "mov"],
  ["video/x-msvideo", "avi"],
  ["video/3gpp", "3gp"],
  ["video/3gpp2", "3g2"],
  [MPEG_AUDIO, "mp3"],
  ["audio/mp4", "m4a"],
  ["audio/wav", "wav"],
  ["audio/aac", "aac"],
  ["audio/ogg", "ogg"],
  ["model/gltf-binary", "glb"],
  ["application/pdf", "pdf"],
  ["text/csv", "csv"],
  ["text/plain", "txt"],
]);

const TYPE_ALIASES: Readonly<Record<string, string>> = {
  "image/jpg": JPEG,
  "image/pjpeg": JPEG,
  "image/x-png": "image/png",
  "audio/mp3": MPEG_AUDIO,
  "audio/mpeg3": MPEG_AUDIO,
  "audio/x-mpeg": MPEG_AUDIO,
  "audio/x-mp3": MPEG_AUDIO,
  "audio/x-wav": "audio/wav",
  "audio/wave": "audio/wav",
  "audio/x-aac": "audio/aac",
  "audio/x-m4a": "audio/mp4",
};

/** Extensions that name the same format as the canonical one. */
const EXTENSION_ALIASES: Readonly<Record<string, string>> = {
  jpeg: "jpg",
  qt: "mov",
};

interface MediaSignature {
  readonly type: string;
  readonly extension: string;
}

const toSignature = (type: string | null): MediaSignature | null => {
  const extension = type ? EXTENSION_BY_TYPE.get(type) : undefined;
  return type && extension ? { type, extension } : null;
};

/** The saved extension for a declared served type, if it is one. */
export function getExtensionForDeclaredType(
  value: string | null | undefined
): string | null {
  const type = (value?.split(";")[0] ?? "").trim().toLowerCase();
  return toSignature(TYPE_ALIASES[type] ?? type)?.extension ?? null;
}

/** Whether a sniffed format and a file extension name the same format. */
export function isSameFormat(
  signature: MediaSignature,
  extension: string
): boolean {
  return signature.extension === (EXTENSION_ALIASES[extension] ?? extension);
}

const ascii = (bytes: Uint8Array, start: number, end: number): string =>
  String.fromCodePoint(...bytes.subarray(start, end));

const startsWith = (bytes: Uint8Array, signature: readonly number[]) =>
  signature.every((value, index) => bytes[index] === value);

const HEIC_BRANDS = new Set(["heic", "heix", "hevc", "hevx", "heim", "heis"]);
const HEIF_BRANDS = new Set(["mif1", "msf1"]);
const MP4_BRANDS = new Set([
  "isom",
  "iso2",
  "iso3",
  "iso4",
  "iso5",
  "iso6",
  "iso7",
  "iso8",
  "iso9",
  "mp41",
  "mp42",
  "mp71",
  "avc1",
  "dash",
  "M4V ",
  "M4VP",
  "MSNV",
  "NDAS",
  "mmp4",
  "f4v ",
]);

/** The type an ISO base media brand stands for; null when unrecognised. */
function getIsoBrandType(brand: string): string | null {
  if (HEIC_BRANDS.has(brand)) return HEIC;
  if (brand === "avif" || brand === "avis") return AVIF;
  if (brand === "M4A " || brand === "M4B ") return "audio/mp4";
  if (brand.startsWith("3g2")) return "video/3gpp2";
  if (brand.startsWith("3gp")) return "video/3gpp";
  if (brand === "qt  ") return QUICKTIME;
  return MP4_BRANDS.has(brand) ? MP4 : null;
}

function getIsoMediaType(bytes: Uint8Array): string | null {
  if (ascii(bytes, 4, 8) !== "ftyp") {
    return null;
  }
  const major = ascii(bytes, 8, 12);
  const declaredBoxSize =
    (((bytes[0] ?? 0) << 24) |
      ((bytes[1] ?? 0) << 16) |
      ((bytes[2] ?? 0) << 8) |
      (bytes[3] ?? 0)) >>>
    0;
  const boxEnd = Math.min(declaredBoxSize, bytes.length);
  const compatible: string[] = [];
  for (let offset = 16; offset + 4 <= boxEnd; offset += 4) {
    compatible.push(ascii(bytes, offset, offset + 4));
  }

  if (HEIF_BRANDS.has(major)) {
    // Generic image-file brand: the compatible brands say which codec.
    if (compatible.some((brand) => brand === "avif" || brand === "avis")) {
      return AVIF;
    }
    return compatible.some((brand) => HEIC_BRANDS.has(brand))
      ? HEIC
      : "image/heif";
  }

  return (
    getIsoBrandType(major) ??
    compatible.map(getIsoBrandType).find((type) => type !== null) ??
    null
  );
}

function getRiffType(bytes: Uint8Array): string | null {
  if (ascii(bytes, 0, 4) !== "RIFF") {
    return null;
  }
  const format = ascii(bytes, 8, 12);
  if (format === "WEBP") return "image/webp";
  if (format === "WAVE") return "audio/wav";
  return format === "AVI " ? "video/x-msvideo" : null;
}

const isUtf16ByteOrderMark = (bytes: Uint8Array) =>
  startsWith(bytes, [0xff, 0xfe]) || startsWith(bytes, [0xfe, 0xff]);

/** An MPEG audio frame header: sync, then valid version, layer and rates. */
function isMpegAudioFrame(bytes: Uint8Array): boolean {
  const [first, second, third] = bytes;
  if (first !== 0xff || second === undefined || third === undefined) {
    return false;
  }
  const version = (second >> 3) & 0b11;
  const layer = (second >> 1) & 0b11;
  const bitrate = third >> 4;
  const sampleRate = (third >> 2) & 0b11;
  return (
    (second & 0xe0) === 0xe0 &&
    version !== 0b01 &&
    layer !== 0b00 &&
    bitrate !== 0b0000 &&
    bitrate !== 0b1111 &&
    sampleRate !== 0b11
  );
}

/** An ADTS (AAC) frame header with a valid sampling frequency index. */
function isAdtsFrame(bytes: Uint8Array): boolean {
  const [first, second, third] = bytes;
  return (
    first === 0xff &&
    second !== undefined &&
    third !== undefined &&
    (second & 0xf6) === 0xf0 &&
    ((third >> 2) & 0x0f) <= 12
  );
}

function getAudioFrameType(bytes: Uint8Array): string | null {
  if (ascii(bytes, 0, 3) === "ID3") return MPEG_AUDIO;
  // UTF-16 text starts with FF FE or FE FF, which can look like a frame.
  if (isUtf16ByteOrderMark(bytes)) return null;
  if (isAdtsFrame(bytes)) return "audio/aac";
  return isMpegAudioFrame(bytes) ? MPEG_AUDIO : null;
}

/** The served media format the leading bytes belong to, if recognised. */
export function sniffMediaType(bytes: Uint8Array): MediaSignature | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return toSignature("image/png");
  }
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return toSignature(JPEG);
  const head = ascii(bytes, 0, 6);
  if (head === "GIF87a" || head === "GIF89a") return toSignature("image/gif");
  if (head.startsWith("%PDF-")) return toSignature("application/pdf");
  if (head.startsWith("glTF")) return toSignature("model/gltf-binary");
  if (head.startsWith("OggS")) return toSignature("audio/ogg");
  return toSignature(
    getIsoMediaType(bytes) ?? getRiffType(bytes) ?? getAudioFrameType(bytes)
  );
}

const MARKUP_STARTS = [
  "<!doctype",
  "<html",
  "<head",
  "<body",
  "<svg",
  "<?xml",
  "<script",
  "<iframe",
  "<!--",
];

/** The leading bytes as text, without a byte-order mark. */
function getLeadingText(bytes: Uint8Array): string {
  if (startsWith(bytes, [0xef, 0xbb, 0xbf])) {
    return ascii(bytes, 3, bytes.length);
  }
  if (isUtf16ByteOrderMark(bytes)) {
    // Keep the low byte of each UTF-16 unit; enough to see ASCII markup.
    const lowByteOffset = bytes[0] === 0xff ? 2 : 3;
    const units: number[] = [];
    for (let index = lowByteOffset; index < bytes.length; index += 2) {
      units.push(bytes[index] ?? 0);
    }
    return String.fromCodePoint(...units);
  }
  return ascii(bytes, 0, bytes.length);
}

/** Whether the bytes are an HTML, SVG or XML document. */
export function isMarkupContent(bytes: Uint8Array): boolean {
  const text = getLeadingText(bytes).trimStart().toLowerCase();
  return MARKUP_STARTS.some((start) => text.startsWith(start));
}
