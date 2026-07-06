import type { GithubResource } from "./types";

const GITHUB_NUMBER_PATTERN = /^\d+$/;

const safeDecode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const encodePathPart = (value: string): string =>
  encodeURIComponent(value);

export const encodeGithubPath = (path: string): string =>
  path.split("/").map(encodePathPart).join("/");

const toPositiveNumber = (value: string | undefined): number | null => {
  if (!value || !GITHUB_NUMBER_PATTERN.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const parseGithubLineAnchor = (
  hash: string
): { readonly lineStart: number | null; readonly lineEnd: number | null } => {
  const normalized = hash.replace(/^#/, "");
  const match = /^L(\d+)(?:-L(\d+))?$/i.exec(normalized);
  if (!match) {
    return { lineStart: null, lineEnd: null };
  }

  const lineStart = toPositiveNumber(match[1]);
  const lineEnd = toPositiveNumber(match[2]);
  if (!lineStart) {
    return { lineStart: null, lineEnd: null };
  }

  return {
    lineStart,
    lineEnd: lineEnd && lineEnd >= lineStart ? lineEnd : lineStart,
  };
};

export const parseGithubResource = (rawUrl: string | null): GithubResource => {
  if (!rawUrl) {
    throw new Error("A url query parameter is required.");
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid GitHub URL.");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Invalid GitHub URL protocol.");
  }

  const hostname = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  if (hostname !== "github.com") {
    throw new Error("Only github.com repository URLs are supported.");
  }

  const [owner, repo, kindSegment, ...rest] = parsed.pathname
    .split("/")
    .filter(Boolean)
    .map(safeDecode);

  if (!owner || !repo) {
    throw new Error("Only github.com repository URLs are supported.");
  }

  const base = { href: rawUrl.trim(), owner, repo };
  const number = toPositiveNumber(rest[0]);
  const lineRange = parseGithubLineAnchor(parsed.hash);

  switch (kindSegment) {
    case undefined:
    case "pulls":
      return { ...base, kind: "repository" };
    case "issues":
      if (!rest[0]) {
        return { ...base, kind: "repository" };
      }
      if (number) {
        return { ...base, kind: "issue", number };
      }
      throw new Error("Only github.com repository URLs are supported.");
    case "pull":
      if (number) {
        return { ...base, kind: "pull", number };
      }
      throw new Error("Only github.com repository URLs are supported.");
    case "blob":
      if (rest.length < 2) {
        throw new Error("Only github.com repository URLs are supported.");
      }
      return {
        ...base,
        kind: "content",
        mode: kindSegment,
        segments: rest,
        ...lineRange,
      };
    case "tree":
      if (rest.length < 1) {
        throw new Error("Only github.com repository URLs are supported.");
      }
      return {
        ...base,
        kind: "content",
        mode: kindSegment,
        segments: rest,
        lineStart: null,
        lineEnd: null,
      };
    case "commit":
      if (!rest[0]) {
        throw new Error("Only github.com repository URLs are supported.");
      }
      return { ...base, kind: "commit", ref: rest[0] };
    case "releases":
      return {
        ...base,
        kind: "release",
        tag: rest[0] === "tag" && rest[1] ? rest.slice(1).join("/") : null,
      };
    case "actions":
      return {
        ...base,
        kind: "actions",
        runId: rest[0] === "runs" ? toPositiveNumber(rest[1]) : null,
        workflowId: rest[0] === "workflows" && rest[1] ? rest[1] : null,
      };
    case "discussions":
      return { ...base, kind: "discussion", number };
    default:
      throw new Error("Only github.com repository URLs are supported.");
  }
};

export const getResourceCacheKey = (resource: GithubResource): string => {
  const base = [resource.owner, resource.repo];

  switch (resource.kind) {
    case "repository":
      return JSON.stringify(["github-preview", "repository", ...base]);
    case "issue":
      return JSON.stringify([
        "github-preview",
        "issue",
        ...base,
        resource.number,
      ]);
    case "pull":
      return JSON.stringify([
        "github-preview",
        "pull",
        ...base,
        resource.number,
      ]);
    case "content":
      return JSON.stringify([
        "github-preview",
        "content",
        ...base,
        resource.mode,
        resource.lineStart,
        resource.lineEnd,
        ...resource.segments,
      ]);
    case "commit":
      return JSON.stringify([
        "github-preview",
        "commit",
        ...base,
        resource.ref,
      ]);
    case "release":
      return JSON.stringify([
        "github-preview",
        "release",
        ...base,
        resource.tag,
      ]);
    case "actions":
      return JSON.stringify([
        "github-preview",
        "actions",
        ...base,
        resource.runId,
        resource.workflowId,
      ]);
    case "discussion":
      return JSON.stringify([
        "github-preview",
        "discussion",
        ...base,
        resource.number,
      ]);
  }
};
