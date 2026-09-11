import type { GithubPreviewResponse } from "@/services/api/github-preview-api";

export type GithubLinkKind =
  | "pull"
  | "issue"
  | "repository"
  | "file"
  | "directory"
  | "commit"
  | "release"
  | "actions"
  | "discussion"
  | "github";

export interface ParsedGithubLink {
  readonly href: string;
  readonly owner: string;
  readonly repo: string;
  readonly kind: GithubLinkKind;
  readonly number?: number | undefined;
  readonly pathLabel?: string | undefined;
}

export type GithubPreviewState =
  | { readonly type: "idle" }
  | { readonly type: "loading" }
  | { readonly type: "success"; readonly preview: GithubPreviewResponse }
  | { readonly type: "error" };

export interface GithubFact {
  readonly label: string;
  readonly value: string;
  readonly tone?: "default" | "success" | "warning" | "danger" | undefined;
}

export interface GithubAccent {
  readonly kind: GithubLinkKind;
  readonly railColor: string;
  readonly borderColor: string;
  readonly backgroundColor: string;
  readonly textColor: string;
}

const GITHUB_NUMBER_PATTERN = /^\d+$/;
export const GITHUB_ACCENTS: Record<
  GithubLinkKind,
  Omit<GithubAccent, "kind">
> = {
  pull: {
    railColor: "#8b5cf6",
    borderColor: "rgba(139, 92, 246, 0.32)",
    backgroundColor: "rgba(139, 92, 246, 0.12)",
    textColor: "#ddd6fe",
  },
  issue: {
    railColor: "#22c55e",
    borderColor: "rgba(34, 197, 94, 0.3)",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    textColor: "#bbf7d0",
  },
  repository: {
    railColor: "#38bdf8",
    borderColor: "rgba(56, 189, 248, 0.28)",
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    textColor: "#bae6fd",
  },
  file: {
    railColor: "#f59e0b",
    borderColor: "rgba(245, 158, 11, 0.32)",
    backgroundColor: "rgba(245, 158, 11, 0.11)",
    textColor: "#fde68a",
  },
  directory: {
    railColor: "#14b8a6",
    borderColor: "rgba(20, 184, 166, 0.3)",
    backgroundColor: "rgba(20, 184, 166, 0.1)",
    textColor: "#99f6e4",
  },
  commit: {
    railColor: "#fb923c",
    borderColor: "rgba(251, 146, 60, 0.3)",
    backgroundColor: "rgba(251, 146, 60, 0.1)",
    textColor: "#fed7aa",
  },
  release: {
    railColor: "#10b981",
    borderColor: "rgba(16, 185, 129, 0.3)",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    textColor: "#a7f3d0",
  },
  actions: {
    railColor: "#60a5fa",
    borderColor: "rgba(96, 165, 250, 0.3)",
    backgroundColor: "rgba(96, 165, 250, 0.1)",
    textColor: "#bfdbfe",
  },
  discussion: {
    railColor: "#ec4899",
    borderColor: "rgba(236, 72, 153, 0.3)",
    backgroundColor: "rgba(236, 72, 153, 0.1)",
    textColor: "#fbcfe8",
  },
  github: {
    railColor: "#94a3b8",
    borderColor: "rgba(148, 163, 184, 0.26)",
    backgroundColor: "rgba(148, 163, 184, 0.08)",
    textColor: "#cbd5e1",
  },
};

const safeDecode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const toPositiveNumber = (value: string | undefined): number | undefined => {
  if (!value || !GITHUB_NUMBER_PATTERN.test(value)) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

const getRepositoryPathLabel = (
  segment: string | undefined,
  rest: readonly string[]
): { readonly kind: GithubLinkKind; readonly label?: string | undefined } => {
  switch (segment) {
    case undefined:
      return { kind: "repository" };
    case "blob":
      return { kind: "file", label: rest.length > 0 ? rest.join("/") : "File" };
    case "tree":
      return {
        kind: "directory",
        label: rest.length > 0 ? rest.join("/") : "Directory",
      };
    case "commit":
      return {
        kind: "commit",
        label: rest[0] ? rest[0].slice(0, 12) : "Commit",
      };
    case "releases":
      return {
        kind: "release",
        label:
          rest[0] === "tag" && rest[1] ? rest.slice(1).join("/") : "Releases",
      };
    case "actions":
      return { kind: "actions", label: "Actions" };
    case "discussions":
      return {
        kind: "discussion",
        label: rest[0] ? `#${rest[0]}` : "Discussions",
      };
    case "issues":
      return { kind: "repository", label: "Issues" };
    case "pulls":
      return { kind: "repository", label: "Pull requests" };
    default:
      return { kind: "github", label: segment };
  }
};

export const parseGithubLink = (href: string): ParsedGithubLink | null => {
  let url: URL;

  try {
    url = new URL(href);
  } catch {
    return null;
  }

  const hostname = url.hostname.replace(/^www\./i, "").toLowerCase();
  if (hostname !== "github.com") {
    return null;
  }

  const [ownerSegment, repoSegment, kindSegment, numberSegment, ...rest] =
    url.pathname.split("/").filter(Boolean);

  if (!ownerSegment || !repoSegment) {
    return null;
  }

  const owner = safeDecode(ownerSegment);
  const repo = safeDecode(repoSegment);
  const number = toPositiveNumber(numberSegment);

  if (kindSegment === "pull" && number) {
    return {
      href,
      owner,
      repo,
      kind: "pull",
      number,
    };
  }

  if (kindSegment === "issues" && number) {
    return {
      href,
      owner,
      repo,
      kind: "issue",
      number,
    };
  }

  // Non-PR/issue GitHub routes keep the segment after the repo as part of the
  // display path, e.g. /commit/<sha> exposes the sha as numberSegment here.
  const repositoryPath = getRepositoryPathLabel(
    kindSegment,
    [numberSegment, ...rest].filter((value): value is string => Boolean(value))
  );

  return {
    href,
    owner,
    repo,
    kind: repositoryPath.kind,
    pathLabel: repositoryPath.label,
  };
};

// Rich previews fetch only for known GitHub resource shapes. Unknown subroutes
// keep local labels to avoid broad fan-out through the server API route.
