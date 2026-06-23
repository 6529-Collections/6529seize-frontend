export type ExternalFileKind =
  | "pdf"
  | "csv"
  | "text"
  | "code"
  | "image"
  | "audio"
  | "video"
  | "archive"
  | "document"
  | "spreadsheet"
  | "presentation"
  | "binary"
  | "unknown";

const EXTENSIONS_BY_KIND: Readonly<
  Record<ExternalFileKind, readonly string[]>
> = {
  pdf: ["pdf"],
  csv: ["csv"],
  text: ["txt", "log", "text"],
  code: [
    "c",
    "cc",
    "cpp",
    "cs",
    "css",
    "go",
    "h",
    "hpp",
    "html",
    "java",
    "js",
    "json",
    "jsx",
    "md",
    "mdx",
    "mjs",
    "php",
    "py",
    "rb",
    "rs",
    "scss",
    "sh",
    "sol",
    "sql",
    "ts",
    "tsx",
    "xml",
    "yaml",
    "yml",
  ],
  image: ["avif", "bmp", "gif", "heic", "jpeg", "jpg", "png", "svg", "webp"],
  audio: ["aac", "flac", "m4a", "mp3", "ogg", "wav"],
  video: ["avi", "m4v", "mov", "mp4", "mpeg", "mpg", "webm"],
  archive: ["7z", "bz2", "gz", "rar", "tar", "tgz", "zip"],
  document: ["doc", "docx", "odt", "rtf"],
  spreadsheet: ["ods", "xls", "xlsx"],
  presentation: ["key", "odp", "ppt", "pptx"],
  binary: ["bin", "dat", "dmg", "exe", "iso", "pkg"],
  unknown: [],
};

const MIME_PREFIX_KIND: ReadonlyArray<readonly [string, ExternalFileKind]> = [
  ["image/", "image"],
  ["audio/", "audio"],
  ["video/", "video"],
  ["text/", "text"],
];

const MIME_TYPES_BY_KIND: ReadonlyArray<
  readonly [ExternalFileKind, readonly string[]]
> = [
  [
    "archive",
    [
      "application/gzip",
      "application/x-7z-compressed",
      "application/x-bzip2",
      "application/x-rar-compressed",
      "application/x-tar",
      "application/zip",
    ],
  ],
  [
    "code",
    [
      "application/javascript",
      "application/json",
      "application/x-sh",
      "application/xml",
      "text/html",
      "text/javascript",
      "text/markdown",
      "text/xml",
    ],
  ],
  [
    "document",
    [
      "application/msword",
      "application/rtf",
      "application/vnd.oasis.opendocument.text",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  ],
  [
    "presentation",
    [
      "application/vnd.apple.keynote",
      "application/vnd.ms-powerpoint",
      "application/vnd.oasis.opendocument.presentation",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
  ],
  [
    "spreadsheet",
    [
      "application/vnd.ms-excel",
      "application/vnd.oasis.opendocument.spreadsheet",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
  ],
  ["binary", ["application/octet-stream"]],
  ["csv", ["text/csv"]],
  ["pdf", ["application/pdf"]],
];

const MIME_KIND = MIME_TYPES_BY_KIND.reduce<Record<string, ExternalFileKind>>(
  (acc, [kind, mimeTypes]) => {
    for (const mimeType of mimeTypes) {
      acc[mimeType] = kind;
    }
    return acc;
  },
  {}
);

const DEFAULT_MIME_TYPE_BY_EXTENSION: Readonly<Record<string, string>> = {
  csv: "text/csv",
  css: "text/css",
  gif: "image/gif",
  html: "text/html",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  js: "application/javascript",
  json: "application/json",
  md: "text/markdown",
  pdf: "application/pdf",
  png: "image/png",
  svg: "image/svg+xml",
  ts: "text/typescript",
  tsx: "text/typescript",
  txt: "text/plain",
  webp: "image/webp",
  xml: "application/xml",
  yaml: "application/yaml",
  yml: "application/yaml",
  zip: "application/zip",
};

const EXTENSION_KIND = Object.entries(EXTENSIONS_BY_KIND).reduce<
  Record<string, ExternalFileKind>
>((acc, [kind, extensions]) => {
  for (const extension of extensions) {
    acc[extension] = kind as ExternalFileKind;
  }
  return acc;
}, {});

export function getNormalizedMimeType(
  contentType: string | null | undefined
): string | null {
  const normalized = contentType?.split(";")[0]?.trim().toLowerCase();
  return normalized && normalized.length > 0 ? normalized : null;
}

export function getFileExtension(
  value: string | null | undefined
): string | null {
  const path = value?.split(/[?#]/)[0] ?? "";
  const fileName = path.split("/").findLast((part) => part.length > 0) ?? "";
  const match = /\.([A-Za-z0-9]{1,16})$/.exec(fileName);
  return match?.[1]?.toLowerCase() ?? null;
}

function getFileKindFromExtension(
  extension: string | null | undefined
): ExternalFileKind | null {
  if (!extension) {
    return null;
  }
  return EXTENSION_KIND[extension.toLowerCase()] ?? null;
}

export function getDefaultMimeTypeForExtension(
  extension: string | null | undefined
): string | null {
  if (!extension) {
    return null;
  }
  return DEFAULT_MIME_TYPE_BY_EXTENSION[extension.toLowerCase()] ?? null;
}

function getFileKindFromContentType(
  contentType: string | null | undefined
): ExternalFileKind | null {
  const mimeType = getNormalizedMimeType(contentType);
  if (!mimeType) {
    return null;
  }

  const exactKind = MIME_KIND[mimeType];
  if (exactKind) {
    return exactKind;
  }

  const prefixKind = MIME_PREFIX_KIND.find(([prefix]) =>
    mimeType.startsWith(prefix)
  )?.[1];
  return prefixKind ?? null;
}

export function detectExternalFileKind({
  extension,
  contentType,
}: {
  readonly extension?: string | null | undefined;
  readonly contentType?: string | null | undefined;
}): ExternalFileKind {
  return (
    getFileKindFromContentType(contentType) ??
    getFileKindFromExtension(extension) ??
    "unknown"
  );
}

export function isClearlyFileLikeUrl(url: URL): boolean {
  return getFileKindFromExtension(url.pathname) !== null;
}

export function isBinaryFileKind(kind: ExternalFileKind): boolean {
  return !["code", "csv", "text", "unknown"].includes(kind);
}
