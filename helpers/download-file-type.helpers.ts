import {
  MEDIA_SIGNATURE_BYTE_COUNT,
  getExtensionForDeclaredType,
  isMarkupContent,
  isSameFormat,
  sniffMediaType,
} from "@/helpers/media-signature.helpers";

/**
 * Decides the type and file name of a file the app saves for the user.
 *
 * - The name's last extension counts (`invoice.pdf.exe` is an `exe`).
 *   Extensions that can run or render active content become `.bin`.
 * - An inert document, data, archive or media extension is kept. The file is
 *   saved as its media type only when the leading bytes confirm that format;
 *   otherwise as `application/octet-stream`, so the browser downloads it
 *   instead of rendering it, whatever type the server declared.
 * - Bytes that are an HTML, SVG or XML document become `.bin` unless the
 *   name is a plain-text format (such a file still downloads as text).
 * - A missing or unknown extension takes the format the bytes show, or,
 *   for a name without any extension, a served media type the caller
 *   declared; otherwise `.bin`.
 */

const OPAQUE_TYPE = "application/octet-stream";
const OPAQUE_EXTENSION = "bin";
const DEFAULT_BASE_NAME = "download";
const MAX_BASE_NAME_LENGTH = 100;

/** Raster image extensions the app shows and keeps on download. */
const IMAGE_EXTENSIONS: ReadonlySet<string> = new Set(
  "png jpg jpeg gif webp avif heic heif bmp".split(" ")
);

/** Whether a URL path names a raster image file by its extension. */
export function hasImageFileExtension(pathname: string): boolean {
  const extension = /\.([a-z0-9]+)$/i.exec(pathname)?.[1]?.toLowerCase();
  return extension !== undefined && IMAGE_EXTENSIONS.has(extension);
}

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
    "wav flac mp3 mpeg m4a m4b aac ogg mp4 m4v mov qt avi webm 3gp 3g2",
  ]
    .flatMap((group) => group.split(" "))
    .concat([...IMAGE_EXTENSIONS])
);

/** Extensions that are always saved as `.bin`, even if listed above. */
const ACTIVE_EXTENSIONS: ReadonlySet<string> = new Set(
  [
    "html htm xhtml shtml svg svgz xml xsl",
    "js mjs cjs wasm hta ps1 vbs jar sh",
    "exe msi bat cmd com scr pif app dmg pkg apk lnk url desktop",
  ].flatMap((group) => group.split(" "))
);

/** Plain-text formats; markup inside them still downloads as text. */
const TEXT_EXTENSIONS: ReadonlySet<string> = new Set([
  "txt",
  "md",
  "csv",
  "tsv",
  "json",
]);

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

/**
 * The name and type to save a file under.
 *
 * `leadingBytes` are the first bytes of the content when the caller has them
 * (a native download is written to disk first, and a direct link is never
 * read, so those decide by name alone).
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
  const opaque = {
    fileName: `${safeBase}.${OPAQUE_EXTENSION}`,
    type: OPAQUE_TYPE,
  };
  if (extension && ACTIVE_EXTENSIONS.has(extension)) {
    return opaque;
  }
  if (
    leadingBytes &&
    isMarkupContent(leadingBytes) &&
    !(extension && TEXT_EXTENSIONS.has(extension))
  ) {
    return opaque;
  }

  const sniffed = leadingBytes ? sniffMediaType(leadingBytes) : null;
  if (extension && INERT_EXTENSIONS.has(extension)) {
    return {
      fileName: `${safeBase}.${extension}`,
      type:
        sniffed && isSameFormat(sniffed, extension)
          ? sniffed.type
          : OPAQUE_TYPE,
    };
  }
  if (sniffed) {
    return { fileName: `${safeBase}.${sniffed.extension}`, type: sniffed.type };
  }

  const declaredExtension = extension
    ? null
    : (declaredTypes
        .map(getExtensionForDeclaredType)
        .find((value) => value !== null) ?? null);
  return declaredExtension
    ? { fileName: `${safeBase}.${declaredExtension}`, type: OPAQUE_TYPE }
    : opaque;
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
    reader.readAsArrayBuffer(blob.slice(0, MEDIA_SIGNATURE_BYTE_COUNT));
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
