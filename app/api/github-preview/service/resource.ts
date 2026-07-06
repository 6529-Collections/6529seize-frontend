import type { GithubResource } from "./types";

const GITHUB_NUMBER_PATTERN = /^\d+$/;
const unsupportedGithubUrlError = (): Error =>
  new Error("Only github.com repository URLs are supported.");

interface GithubResourceBaseParts {
  readonly href: string;
  readonly owner: string;
  readonly repo: string;
}

interface GithubResourceParseContext {
  readonly base: GithubResourceBaseParts;
  readonly rest: readonly string[];
  readonly number: number | null;
  readonly lineRange: {
    readonly lineStart: number | null;
    readonly lineEnd: number | null;
  };
}

type GithubResourceParser = (
  context: GithubResourceParseContext
) => GithubResource;

const throwUnsupportedGithubUrl = (): never => {
  throw unsupportedGithubUrlError();
};

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

const parseRepositoryResource = (
  context: GithubResourceParseContext
): GithubResource => ({ ...context.base, kind: "repository" });

const parseIssueResource = ({
  base,
  number,
  rest,
}: GithubResourceParseContext): GithubResource => {
  if (!rest[0]) {
    return { ...base, kind: "repository" };
  }

  return number
    ? { ...base, kind: "issue", number }
    : throwUnsupportedGithubUrl();
};

const parsePullResource = ({
  base,
  number,
}: GithubResourceParseContext): GithubResource =>
  number ? { ...base, kind: "pull", number } : throwUnsupportedGithubUrl();

const parseBlobResource = ({
  base,
  lineRange,
  rest,
}: GithubResourceParseContext): GithubResource => {
  if (rest.length < 2) {
    throwUnsupportedGithubUrl();
  }

  return {
    ...base,
    kind: "content",
    mode: "blob",
    segments: rest,
    ...lineRange,
  };
};

const parseTreeResource = ({
  base,
  rest,
}: GithubResourceParseContext): GithubResource => {
  if (rest.length < 1) {
    throwUnsupportedGithubUrl();
  }

  return {
    ...base,
    kind: "content",
    mode: "tree",
    segments: rest,
    lineStart: null,
    lineEnd: null,
  };
};

const parseCommitResource = ({
  base,
  rest,
}: GithubResourceParseContext): GithubResource => {
  const [ref] = rest;
  return ref ? { ...base, kind: "commit", ref } : throwUnsupportedGithubUrl();
};

const parseReleaseResource = ({
  base,
  rest,
}: GithubResourceParseContext): GithubResource => ({
  ...base,
  kind: "release",
  tag: rest[0] === "tag" && rest[1] ? rest.slice(1).join("/") : null,
});

const parseActionsResource = ({
  base,
  rest,
}: GithubResourceParseContext): GithubResource => ({
  ...base,
  kind: "actions",
  runId: rest[0] === "runs" ? toPositiveNumber(rest[1]) : null,
  workflowId: rest[0] === "workflows" && rest[1] ? rest[1] : null,
});

const parseDiscussionResource = ({
  base,
  number,
}: GithubResourceParseContext): GithubResource => ({
  ...base,
  kind: "discussion",
  number,
});

const resourceParsers: Record<string, GithubResourceParser> = {
  actions: parseActionsResource,
  blob: parseBlobResource,
  commit: parseCommitResource,
  discussions: parseDiscussionResource,
  issues: parseIssueResource,
  pull: parsePullResource,
  pulls: parseRepositoryResource,
  releases: parseReleaseResource,
  tree: parseTreeResource,
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
    throw unsupportedGithubUrlError();
  }

  const [owner, repo, kindSegment, ...rest] = parsed.pathname
    .split("/")
    .filter(Boolean)
    .map(safeDecode);

  if (!owner || !repo) {
    throw unsupportedGithubUrlError();
  }

  const base = { href: rawUrl.trim(), owner, repo };
  if (!kindSegment) {
    return { ...base, kind: "repository" };
  }

  const parser = resourceParsers[kindSegment] ?? throwUnsupportedGithubUrl;
  return parser({
    base,
    rest,
    number: toPositiveNumber(rest[0]),
    lineRange: parseGithubLineAnchor(parsed.hash),
  });
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
