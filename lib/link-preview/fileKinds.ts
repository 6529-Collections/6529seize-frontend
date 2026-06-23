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

const MIME_KIND: Readonly<Record<string, ExternalFileKind>> = {
  "application/gzip": "archive",
  "application/javascript": "code",
  "application/json": "code",
  "application/msword": "document",
  "application/octet-stream": "binary",
  "application/pdf": "pdf",
  "application/rtf": "document",
  "application/vnd.apple.keynote": "presentation",
  "application/vnd.ms-excel": "spreadsheet",
  "application/vnd.ms-powerpoint": "presentation",
  "application/vnd.oasis.opendocument.presentation": "presentation",
  "application/vnd.oasis.opendocument.spreadsheet": "spreadsheet",
  "application/vnd.oasis.opendocument.text": "document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    "spreadsheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "document",
  "application/x-7z-compressed": "archive",
  "application/x-bzip2": "archive",
  "application/x-rar-compressed": "archive",
  "application/x-sh": "code",
  "application/x-tar": "archive",
  "application/xml": "code",
  "application/zip": "archive",
  "text/csv": "csv",
  "text/html": "code",
  "text/javascript": "code",
  "text/markdown": "code",
  "text/xml": "code",
};

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
