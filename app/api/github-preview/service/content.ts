import {
  detectExternalFileKind,
  getDefaultMimeTypeForExtension,
  getFileExtension,
  isBinaryFileKind,
} from "@/lib/link-preview/fileKinds";
import type { GithubContentPreviewResponse } from "@/services/api/github-preview-api";
import { fetchGithubJson, isGithubApiNotFoundError } from "./fetchers";
import { encodeGithubPath } from "./resource";
import type {
  GithubContentApiItem,
  GithubContentApiResponse,
  GithubContentResource,
} from "./types";

const CONTENT_EXCERPT_MAX_BYTES = 64 * 1024;
const CONTENT_EXCERPT_MAX_LINES = 5;
const CONTENT_EXCERPT_MAX_LINE_LENGTH = 160;
const CONTENT_REF_SPLIT_LIMIT = 8;

const isGithubContentApiDirectoryResponse = (
  content: GithubContentApiResponse
): content is readonly GithubContentApiItem[] => Array.isArray(content);

const buildContentCandidates = (
  segments: readonly string[]
): readonly { readonly ref: string; readonly path: string }[] => {
  const maxRefSegments = Math.min(segments.length, CONTENT_REF_SPLIT_LIMIT);
  const candidates: { readonly ref: string; readonly path: string }[] = [];

  for (let index = 1; index <= maxRefSegments; index += 1) {
    candidates.push({
      ref: segments.slice(0, index).join("/"),
      path: segments.slice(index).join("/"),
    });
  }

  return candidates;
};

const getFallbackContentTitle = (
  resource: GithubContentResource,
  path: string
): string => {
  const [lastSegment] = path.split("/").filter(Boolean).slice(-1);
  if (lastSegment) {
    return lastSegment;
  }

  return resource.mode === "tree" ? resource.repo : "Code";
};

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  cjs: "JavaScript",
  css: "CSS",
  go: "Go",
  html: "HTML",
  java: "Java",
  js: "JavaScript",
  json: "JSON",
  jsx: "JavaScript",
  md: "Markdown",
  mdx: "MDX",
  mjs: "JavaScript",
  py: "Python",
  rs: "Rust",
  scss: "SCSS",
  sh: "Shell",
  sol: "Solidity",
  sql: "SQL",
  ts: "TypeScript",
  tsx: "TypeScript",
  txt: "Text",
  yml: "YAML",
  yaml: "YAML",
};

const getFileLanguage = (path: string | null | undefined): string | null => {
  const extension = getFileExtension(path);
  return extension ? (EXTENSION_LANGUAGE_MAP[extension] ?? null) : null;
};

const truncateExcerptLine = (line: string): string => {
  const normalized = line.replace(/\t/g, "  ").trimEnd();
  if (normalized.length <= CONTENT_EXCERPT_MAX_LINE_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, CONTENT_EXCERPT_MAX_LINE_LENGTH - 3)}...`;
};

function decodeGithubContentBuffer(
  content: GithubContentApiItem
): Buffer | null {
  if (
    content.encoding !== "base64" ||
    !content.content ||
    (typeof content.size === "number" &&
      content.size > CONTENT_EXCERPT_MAX_BYTES)
  ) {
    return null;
  }

  try {
    const buffer = Buffer.from(content.content.replace(/\s/g, ""), "base64");
    return buffer.byteLength <= CONTENT_EXCERPT_MAX_BYTES ? buffer : null;
  } catch {
    return null;
  }
}

function hasBinaryBytePattern(buffer: Buffer): boolean {
  if (buffer.includes(0)) {
    return true;
  }

  if (buffer.length === 0) {
    return false;
  }

  let controlByteCount = 0;
  for (const byte of buffer) {
    const isAllowedControl = byte === 9 || byte === 10 || byte === 13;
    if (byte < 32 && !isAllowedControl) {
      controlByteCount += 1;
    }
  }

  return controlByteCount / buffer.length > 0.05;
}

const decodeTextContent = (
  content: GithubContentApiItem,
  isBinary: boolean
): { readonly text: string | null; readonly detectedBinary: boolean } => {
  if (isBinary) {
    return { text: null, detectedBinary: true };
  }

  const buffer = decodeGithubContentBuffer(content);
  if (!buffer || hasBinaryBytePattern(buffer)) {
    return { text: null, detectedBinary: Boolean(buffer) };
  }

  return { text: buffer.toString("utf8"), detectedBinary: false };
};

const buildContentExcerpt = (
  content: GithubContentApiItem,
  resource: GithubContentResource,
  isBinary: boolean
): {
  readonly lineCount: number | null;
  readonly excerpt: readonly string[] | null;
  readonly lineStart: number | null;
  readonly lineEnd: number | null;
  readonly detectedBinary: boolean;
} => {
  const decoded = decodeTextContent(content, isBinary);
  if (!decoded.text) {
    return {
      lineCount: null,
      excerpt: null,
      lineStart: resource.lineStart,
      lineEnd: resource.lineEnd,
      detectedBinary: decoded.detectedBinary,
    };
  }

  const lines = decoded.text.replace(/\r\n/g, "\n").split("\n");
  const lineCount = lines.length;
  const requestedStart = resource.lineStart ?? 1;
  if (requestedStart > lineCount) {
    return {
      lineCount,
      excerpt: null,
      lineStart: null,
      lineEnd: null,
      detectedBinary: false,
    };
  }

  const normalizedLineEnd = resource.lineStart
    ? Math.min(resource.lineEnd ?? resource.lineStart, lineCount)
    : null;
  const startIndex = Math.max(0, requestedStart - 1);
  const endIndex =
    normalizedLineEnd && normalizedLineEnd >= requestedStart
      ? normalizedLineEnd
      : Math.min(lines.length, startIndex + CONTENT_EXCERPT_MAX_LINES);
  const excerpt = lines
    .slice(startIndex, Math.max(startIndex + 1, endIndex))
    .slice(0, CONTENT_EXCERPT_MAX_LINES)
    .map(truncateExcerptLine);

  return {
    lineCount,
    excerpt,
    lineStart: resource.lineStart,
    lineEnd: normalizedLineEnd,
    detectedBinary: false,
  };
};

const countDirectoryItems = (
  content: readonly GithubContentApiItem[],
  type: "file" | "dir"
): number => content.filter((item) => item.type === type).length;

const buildContentPreview = (
  resource: GithubContentResource,
  candidate: { readonly ref: string; readonly path: string },
  content: GithubContentApiResponse
): GithubContentPreviewResponse => {
  if (isGithubContentApiDirectoryResponse(content)) {
    const entries = content
      .map((item) => item.name)
      .filter((name): name is string => Boolean(name))
      .slice(0, 4);

    return {
      type: "github.directory",
      owner: resource.owner,
      repo: resource.repo,
      title: getFallbackContentTitle(resource, candidate.path),
      path: candidate.path || null,
      ref: candidate.ref,
      size: null,
      itemCount: content.length,
      extension: null,
      fileKind: null,
      mimeType: null,
      isBinary: null,
      language: null,
      lineCount: null,
      excerpt: null,
      entries,
      fileCount: countDirectoryItems(content, "file"),
      directoryCount: countDirectoryItems(content, "dir"),
      url: resource.href,
    };
  }

  const type =
    content.type === "dir" || resource.mode === "tree"
      ? "github.directory"
      : "github.file";
  const path = content.path ?? (candidate.path || null);
  const extension = type === "github.file" ? getFileExtension(path) : null;
  const mimeType =
    type === "github.file" ? getDefaultMimeTypeForExtension(extension) : null;
  const fileKind =
    type === "github.file"
      ? detectExternalFileKind({ extension, contentType: mimeType })
      : null;
  const isBinaryByKind =
    type === "github.file" && fileKind ? isBinaryFileKind(fileKind) : null;
  const contentExcerpt =
    type === "github.file"
      ? buildContentExcerpt(content, resource, Boolean(isBinaryByKind))
      : null;
  const { detectedBinary, ...contentExcerptResponse } = contentExcerpt ?? {
    lineCount: null,
    excerpt: null,
    lineStart: null,
    lineEnd: null,
    detectedBinary: false,
  };
  const isBinary =
    type === "github.file" ? Boolean(isBinaryByKind || detectedBinary) : null;

  return {
    type,
    owner: resource.owner,
    repo: resource.repo,
    title: content.name ?? getFallbackContentTitle(resource, candidate.path),
    path,
    ref: candidate.ref,
    size: typeof content.size === "number" ? content.size : null,
    itemCount: null,
    extension,
    fileKind,
    mimeType,
    isBinary,
    language: type === "github.file" ? getFileLanguage(path) : null,
    ...contentExcerptResponse,
    entries: null,
    fileCount: null,
    directoryCount: null,
    url: content.html_url ?? resource.href,
  };
};

export const resolveContentPreview = async (
  resource: GithubContentResource
): Promise<GithubContentPreviewResponse> => {
  if (resource.segments.length === 0) {
    throw new Error("Only github.com repository URLs are supported.");
  }

  let lastNotFound: Error | null = null;

  for (const candidate of buildContentCandidates(resource.segments)) {
    const encodedOwner = encodeURIComponent(resource.owner);
    const encodedRepo = encodeURIComponent(resource.repo);
    const encodedPath = candidate.path
      ? `/${encodeGithubPath(candidate.path)}`
      : "";
    const params = new URLSearchParams({ ref: candidate.ref });

    try {
      const content = await fetchGithubJson<GithubContentApiResponse>(
        `/repos/${encodedOwner}/${encodedRepo}/contents${encodedPath}?${params.toString()}`
      );
      return buildContentPreview(resource, candidate, content);
    } catch (error) {
      if (!isGithubApiNotFoundError(error)) {
        throw error;
      }
      lastNotFound = error;
    }
  }

  throw lastNotFound ?? new Error("GitHub content preview metadata not found.");
};
