/**
 * Decides the type and file name of a file the app saves for the user.
 *
 * - When the leading bytes show a served media format (image, video, audio,
 *   GLB, PDF), the file is saved as that type with its usual extension.
 * - Otherwise the name's last extension decides. Inert document, data,
 *   archive and media extensions are kept, and the file is saved as
 *   `application/octet-stream` so the browser downloads it instead of
 *   rendering it, whatever type the server declared.
 * - Extensions a browser or system can render as active content or run
 *   (HTML, SVG, scripts, executables, ...) and unknown or missing extensions
 *   become `.bin`. Only the last extension counts: `invoice.pdf.exe` is an
 *   `exe`.
 */

const OPAQUE_TYPE = "application/octet-stream";
const OPAQUE_EXTENSION = "bin";
const DEFAULT_BASE_NAME = "download";
const MAX_BASE_NAME_LENGTH = 100;
const LEADING_BYTE_COUNT = 16;
const JPEG = "image/jpeg";
const MPEG_AUDIO = "audio/mpeg";
const QUICKTIME = "video/quicktime";

/** Formats the app serves as media or attachments, with the saved extension. */
const DOWNLOAD_EXTENSION_BY_TYPE: ReadonlyMap<string, string> = new Map([
  ["image/png", "png"],
  [JPEG, "jpg"],
  ["image/gif", "gif"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
  ["image/bmp", "bmp"],
  ["video/mp4", "mp4"],
  [QUICKTIME, "mov"],
  ["video/x-msvideo", "avi"],
  [MPEG_AUDIO, "mp3"],
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
};

/**
 * Extensions kept when the bytes do not show a served media format: the
 * formats drops accept as media or attachments (see
 * `services/uploads/mediaUploadMimeType.ts`), plus common document, data and
 * archive files people send in encrypted chats. Saved as octet-stream.
 */
const INERT_EXTENSIONS: ReadonlySet<string> = new Set(
  [
    "txt md csv tsv json pdf doc docx xls xlsx ppt pptx odt ods odp rtf epub",
    "zip 7z rar tar gz",
    "psd ai fig sketch glb gltf obj stl",
    "wav flac mp3 mpeg m4a aac ogg mp4 mov qt avi webm",
    "png jpg jpeg gif webp avif heic bmp",
  ].flatMap((group) => group.split(" "))
);

/** Extensions that are always saved as `.bin`, even if listed above. */
const ACTIVE_EXTENSIONS: ReadonlySet<string> = new Set(
  [
    "html htm xhtml shtml svg svgz xml xsl",
    "js mjs cjs wasm hta ps1 vbs jar sh",
    "exe msi bat cmd com scr pif app dmg pkg apk lnk url desktop",
  ].flatMap((group) => group.split(" "))
);

const ascii = (bytes: Uint8Array, start: number, end: number): string =>
  String.fromCodePoint(...bytes.subarray(start, end));

const startsWith = (bytes: Uint8Array, signature: readonly number[]) =>
  signature.every((value, index) => bytes[index] === value);

function getIsoMediaType(bytes: Uint8Array): string | null {
  if (ascii(bytes, 4, 8) !== "ftyp") {
    return null;
  }
  const brand = ascii(bytes, 8, 12);
  if (brand === "avif" || brand === "avis") {
    return "image/avif";
  }
  return brand === "qt  " ? QUICKTIME : "video/mp4";
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

function getAudioFrameType(bytes: Uint8Array): string | null {
  if (ascii(bytes, 0, 3) === "ID3") {
    return MPEG_AUDIO;
  }
  if (bytes[0] !== 0xff || bytes[1] === undefined) {
    return null;
  }
  if ((bytes[1] & 0xf6) === 0xf0) {
    return "audio/aac";
  }
  return (bytes[1] & 0xe0) === 0xe0 ? MPEG_AUDIO : null;
}

/** The served format the leading bytes belong to, if any. */
function sniffDownloadType(bytes: Uint8Array): string | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png";
  }
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return JPEG;
  const head = ascii(bytes, 0, 6);
  if (head === "GIF87a" || head === "GIF89a") return "image/gif";
  if (head.startsWith("%PDF-")) return "application/pdf";
  if (head.startsWith("glTF")) return "model/gltf-binary";
  if (head.startsWith("OggS")) return "audio/ogg";
  return (
    getIsoMediaType(bytes) ?? getRiffType(bytes) ?? getAudioFrameType(bytes)
  );
}

function normalizeDownloadType(value: string | null | undefined) {
  const type = (value?.split(";")[0] ?? "").trim().toLowerCase();
  const canonical = TYPE_ALIASES[type] ?? type;
  return DOWNLOAD_EXTENSION_BY_TYPE.has(canonical) ? canonical : null;
}

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/g;
/** Bidirectional controls, zero-width characters and the byte-order mark. */
const isFormattingCharacter = (codePoint: number): boolean =>
  codePoint === 0x061c ||
  (codePoint >= 0x200b && codePoint <= 0x200f) ||
  (codePoint >= 0x202a && codePoint <= 0x202e) ||
  (codePoint >= 0x2066 && codePoint <= 0x2069) ||
  codePoint === 0xfeff;

const removeFormattingCharacters = (value: string): string =>
  Array.from(value)
    .filter(
      (character) => !isFormattingCharacter(character.codePointAt(0) ?? 0)
    )
    .join("");
const RESERVED_CHARACTERS = /[/\\:*?"<>|]/g;
const WINDOWS_RESERVED_NAME = /^(?:con|prn|aux|nul|com\d|lpt\d)$/i;
const EXTENSION_PATTERN = /\.([a-z0-9]{1,10})$/i;

function splitFileName(fileName: string): {
  readonly base: string;
  readonly extension: string | null;
} {
  const cleaned = removeFormattingCharacters(fileName.normalize("NFC"))
    .replaceAll(CONTROL_CHARACTERS, "")
    .replaceAll(RESERVED_CHARACTERS, "_")
    .trim();
  const match = EXTENSION_PATTERN.exec(cleaned);
  const extension = match?.[1]?.toLowerCase() ?? null;
  const base = (match ? cleaned.slice(0, match.index) : cleaned)
    .replace(/^[.\s]+/, "")
    .replace(/[.\s]+$/, "");
  return { base, extension };
}

function getSafeBaseName(base: string): string {
  const shortened = Array.from(base)
    .slice(0, MAX_BASE_NAME_LENGTH)
    .join("")
    .replace(/[.\s]+$/, "");
  if (!shortened) {
    return DEFAULT_BASE_NAME;
  }
  const stem = shortened.split(".")[0] ?? "";
  return WINDOWS_RESERVED_NAME.test(stem) ? `_${shortened}` : shortened;
}

interface DownloadFileDecision {
  readonly fileName: string;
  readonly type: string;
}

function getKeptExtension(extension: string | null): string | null {
  return extension &&
    INERT_EXTENSIONS.has(extension) &&
    !ACTIVE_EXTENSIONS.has(extension)
    ? extension
    : null;
}

/**
 * The name and type to save a file under.
 *
 * `leadingBytes` are the first bytes of the content when the caller has them
 * (a native download is written to disk first, and a direct link is never
 * read, so those decide by name alone). A name without any extension may take
 * the extension of a served media type the caller declared (for example a
 * video URL without a file name).
 */
export function getDownloadFileDecision({
  fileName,
  declaredTypes = [],
  leadingBytes,
}: {
  readonly fileName: string;
  readonly declaredTypes?: readonly (string | null | undefined)[] | undefined;
  readonly leadingBytes?: Uint8Array | undefined;
}): DownloadFileDecision {
  const { base, extension } = splitFileName(fileName);
  const safeBase = getSafeBaseName(base);
  const sniffed = leadingBytes ? sniffDownloadType(leadingBytes) : null;
  const sniffedExtension = sniffed
    ? DOWNLOAD_EXTENSION_BY_TYPE.get(sniffed)
    : undefined;
  if (sniffed && sniffedExtension) {
    return { fileName: `${safeBase}.${sniffedExtension}`, type: sniffed };
  }

  const declaredExtension = extension
    ? undefined
    : declaredTypes
        .map(normalizeDownloadType)
        .map((type) =>
          type ? DOWNLOAD_EXTENSION_BY_TYPE.get(type) : undefined
        )
        .find((value) => value !== undefined);
  const savedExtension =
    getKeptExtension(extension) ?? declaredExtension ?? OPAQUE_EXTENSION;
  return { fileName: `${safeBase}.${savedExtension}`, type: OPAQUE_TYPE };
}

function readLeadingBytes(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(
        reader.result instanceof ArrayBuffer
          ? new Uint8Array(reader.result)
          : new Uint8Array()
      );
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("File read failed"));
    };
    reader.readAsArrayBuffer(blob.slice(0, LEADING_BYTE_COUNT));
  });
}

/**
 * Re-types fetched content for saving: the returned blob carries the decided
 * type and the returned name the decided extension.
 */
export async function prepareBlobForDownload({
  blob,
  fileName,
  declaredType,
}: {
  readonly blob: Blob;
  readonly fileName: string;
  readonly declaredType?: string | null | undefined;
}): Promise<{ readonly blob: Blob; readonly fileName: string }> {
  const decision = getDownloadFileDecision({
    fileName,
    declaredTypes: [declaredType, blob.type],
    leadingBytes: await readLeadingBytes(blob),
  });
  return {
    blob:
      blob.type === decision.type
        ? blob
        : new Blob([blob], { type: decision.type }),
    fileName: decision.fileName,
  };
}
