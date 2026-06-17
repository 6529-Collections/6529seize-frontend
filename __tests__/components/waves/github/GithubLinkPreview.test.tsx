import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

import GithubLinkPreview, {
  parseGithubLink,
} from "@/components/waves/github/GithubLinkPreview";
import { fetchGithubPreview } from "@/services/api/github-preview-api";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, prefetch: _prefetch, ...rest }: any) => (
    <a
      href={typeof href === "string" ? href : (href?.pathname ?? "")}
      {...rest}
    >
      {children}
    </a>
  ),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: function MockNextImage({
    alt = "",
    unoptimized: _unoptimized,
    ...rest
  }: any) {
    return <img alt={alt} {...rest} />;
  },
}));

jest.mock("@/components/waves/ChatItemHrefButtons", () => ({
  __esModule: true,
  default: ({ href }: { readonly href: string }) => (
    <div data-testid="href-buttons" data-href={href} />
  ),
}));

jest.mock("@/services/api/github-preview-api", () => ({
  fetchGithubPreview: jest.fn(),
}));

const mockedFetchGithubPreview = fetchGithubPreview as jest.MockedFunction<
  typeof fetchGithubPreview
>;

describe("GithubLinkPreview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("parses pull request, issue, and repository GitHub links", () => {
    expect(
      parseGithubLink("https://github.com/6529-Collections/6529Stream/pull/355")
    ).toEqual(
      expect.objectContaining({
        owner: "6529-Collections",
        repo: "6529Stream",
        kind: "pull",
        number: 355,
      })
    );

    expect(
      parseGithubLink(
        "https://github.com/6529-Collections/6529Stream/issues/392"
      )
    ).toEqual(
      expect.objectContaining({
        kind: "issue",
        number: 392,
      })
    );

    expect(
      parseGithubLink("https://github.com/6529-Collections/6529Stream")
    ).toEqual(
      expect.objectContaining({
        kind: "repository",
        owner: "6529-Collections",
        repo: "6529Stream",
      })
    );

    expect(
      parseGithubLink(
        "https://github.com/6529-Collections/6529Stream/blob/main/src/app.ts"
      )
    ).toEqual(
      expect.objectContaining({
        kind: "file",
        pathLabel: "main/src/app.ts",
      })
    );

    expect(
      parseGithubLink(
        "https://github.com/6529-Collections/6529Stream/tree/main/src"
      )
    ).toEqual(
      expect.objectContaining({
        kind: "directory",
        pathLabel: "main/src",
      })
    );

    expect(
      parseGithubLink("https://github.com/6529-Collections/6529Stream/settings")
    ).toEqual(
      expect.objectContaining({
        kind: "github",
        pathLabel: "settings",
      })
    );
  });

  it("renders a rich PR card with inline status and no OpenGraph image", async () => {
    mockedFetchGithubPreview.mockResolvedValue({
      type: "github.pull_request",
      owner: "6529-Collections",
      repo: "6529Stream",
      number: 355,
      title: "[codex] Hydrate command reviews and expose PR costs",
      state: "merged",
      reviewState: "approved",
      mergeableState: "clean",
      merged: true,
      draft: false,
      author: "alice",
      updatedAt: "2026-06-16T00:00:00Z",
      comments: 4,
      commits: 3,
      changedFiles: 6,
      additions: 120,
      deletions: 15,
      baseRef: "main",
      headRef: "codex/github-preview-cards",
      checks: {
        state: "success",
        total: 3,
        successful: 3,
        failed: 0,
        pending: 0,
      },
      labels: [
        { name: "frontend", color: "0e8a16" },
        { name: "github", color: "5319e7" },
      ],
      url: "https://github.com/6529-Collections/6529Stream/pull/355",
    });

    render(
      <GithubLinkPreview href="https://github.com/6529-Collections/6529Stream/pull/355" />
    );

    expect(screen.getByText("Pull request #355")).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText("[codex] Hydrate command reviews and expose PR costs")
      ).toBeInTheDocument();
    });

    const card = screen.getByTestId("github-link-preview-card");
    expect(card).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Open GitHub pull request")
    );
    expect(screen.getByTestId("github-preview-accent")).toHaveAttribute(
      "data-accent-kind",
      "pull"
    );
    expect(screen.getByTestId("github-preview-kind-badge")).toHaveTextContent(
      "Pull request"
    );
    expect(card).not.toHaveClass("tw-h-[10rem]");
    expect(card).not.toHaveClass("md:tw-h-[11rem]");
    expect(screen.getByAltText("")).toHaveAttribute("src", "/github_w.png");
    expect(screen.getByText(/by @alice/)).toBeInTheDocument();
    expect(
      screen.getByText(/codex\/github-preview-cards -> main/)
    ).toBeInTheDocument();
    expect(screen.getByText("Checks")).toBeInTheDocument();
    expect(screen.getByText("3 passing")).toBeInTheDocument();
    expect(screen.getByText("Diff")).toBeInTheDocument();
    expect(screen.getByText("+120 / -15")).toBeInTheDocument();
    expect(screen.getByText("frontend")).toBeInTheDocument();

    const badge = screen.getByTestId("github-preview-status-badge");
    expect(badge).toHaveTextContent("Merged");
    expect(badge).toHaveClass("tw-relative");
    expect(badge).not.toHaveClass("tw-absolute");
    expect(screen.getByTestId("href-buttons")).toHaveAttribute(
      "data-href",
      "https://github.com/6529-Collections/6529Stream/pull/355"
    );
  });

  it("does not render nested interactive descendants inside the card link", async () => {
    mockedFetchGithubPreview.mockResolvedValue({
      type: "github.pull_request",
      owner: "6529-Collections",
      repo: "6529Stream",
      number: 355,
      title: "[codex] Hydrate command reviews and expose PR costs",
      state: "open",
      reviewState: "none",
      mergeableState: "clean",
      merged: false,
      draft: false,
      url: "https://github.com/6529-Collections/6529Stream/pull/355",
    });

    render(
      <GithubLinkPreview href="https://github.com/6529-Collections/6529Stream/pull/355" />
    );

    await waitFor(() => {
      expect(screen.getByText("Open")).toBeInTheDocument();
    });

    const card = screen.getByTestId("github-link-preview-card");
    expect(document.body.querySelectorAll("a")).toHaveLength(1);
    expect(
      card.querySelectorAll(
        'a, button, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])'
      )
    ).toHaveLength(0);
  });

  it("renders enriched repository links", async () => {
    mockedFetchGithubPreview.mockResolvedValue({
      type: "github.repository",
      owner: "6529-Collections",
      repo: "6529Stream",
      title: "6529-Collections/6529Stream",
      description: "Streaming API and bots",
      defaultBranch: "main",
      language: "TypeScript",
      stars: 1200,
      forks: 34,
      openIssues: 9,
      visibility: "public",
      archived: false,
      pushedAt: "2026-06-16T00:00:00Z",
      topics: ["nextjs", "bots"],
      license: "MIT",
      url: "https://github.com/6529-Collections/6529Stream",
    });

    render(
      <GithubLinkPreview href="https://github.com/6529-Collections/6529Stream" />
    );

    expect(screen.getByText("Repository")).toBeInTheDocument();
    expect(screen.getByTestId("github-preview-accent")).toHaveAttribute(
      "data-accent-kind",
      "repository"
    );
    expect(mockedFetchGithubPreview).toHaveBeenCalledWith(
      "https://github.com/6529-Collections/6529Stream"
    );

    await waitFor(() => {
      expect(screen.getByText(/Streaming API and bots/)).toBeInTheDocument();
    });

    expect(screen.getAllByText(/TypeScript/).length).toBeGreaterThan(0);
    expect(screen.queryByTestId("github-preview-status-badge")).toBeNull();
    expect(screen.getByText("nextjs")).toBeInTheDocument();
    expect(screen.getByText("License")).toBeInTheDocument();
  });

  it("renders enriched file links", async () => {
    mockedFetchGithubPreview.mockResolvedValue({
      type: "github.file",
      owner: "6529-Collections",
      repo: "6529Stream",
      title: "app.ts",
      path: "src/app.ts",
      ref: "main",
      size: 2048,
      itemCount: null,
      language: "TypeScript",
      lineCount: 12,
      lineStart: 10,
      lineEnd: 12,
      excerpt: [
        "export function handler() {",
        "  return Response.json({ ok: true });",
        "}",
      ],
      url: "https://github.com/6529-Collections/6529Stream/blob/main/src/app.ts",
    });

    render(
      <GithubLinkPreview href="https://github.com/6529-Collections/6529Stream/blob/main/src/app.ts" />
    );

    expect(screen.getByText("File")).toBeInTheDocument();
    expect(screen.getByTestId("github-preview-accent")).toHaveAttribute(
      "data-accent-kind",
      "file"
    );

    await waitFor(() => {
      expect(screen.getByText("app.ts")).toBeInTheDocument();
    });

    expect(screen.getAllByText(/src\/app\.ts/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/2 KB/).length).toBeGreaterThan(0);
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("L10-L12")).toBeInTheDocument();
    expect(screen.getByTestId("github-file-excerpt")).toHaveTextContent(
      "Response.json"
    );
  });

  it("renders enriched issue links", async () => {
    mockedFetchGithubPreview.mockResolvedValue({
      type: "github.issue",
      owner: "6529-Collections",
      repo: "6529Stream",
      number: 392,
      title: "Tighten link previews",
      state: "open",
      author: "alice",
      updatedAt: "2026-06-16T00:00:00Z",
      comments: 2,
      labels: [{ name: "frontend", color: "0e8a16" }],
      assignees: ["alice", "bob"],
      url: "https://github.com/6529-Collections/6529Stream/issues/392",
    });

    render(
      <GithubLinkPreview href="https://github.com/6529-Collections/6529Stream/issues/392" />
    );

    await waitFor(() => {
      expect(screen.getByText("Tighten link previews")).toBeInTheDocument();
    });

    expect(screen.getByText(/by @alice/)).toBeInTheDocument();
    expect(screen.getByText("Assignees")).toBeInTheDocument();
    expect(screen.getAllByText("@alice +1").length).toBeGreaterThan(0);
    expect(screen.getByText("2 comments")).toBeInTheDocument();
    expect(screen.getByText("frontend")).toBeInTheDocument();
  });

  it("renders enriched directory links", async () => {
    mockedFetchGithubPreview.mockResolvedValue({
      type: "github.directory",
      owner: "6529-Collections",
      repo: "6529Stream",
      title: "src",
      path: "src",
      ref: "main",
      size: null,
      itemCount: 3,
      language: null,
      lineCount: null,
      excerpt: null,
      entries: ["app.ts", "api", "components"],
      fileCount: 1,
      directoryCount: 2,
      url: "https://github.com/6529-Collections/6529Stream/tree/main/src",
    });

    render(
      <GithubLinkPreview href="https://github.com/6529-Collections/6529Stream/tree/main/src" />
    );

    await waitFor(() => {
      expect(screen.getByText("src")).toBeInTheDocument();
    });

    expect(screen.getByText("Items")).toBeInTheDocument();
    expect(screen.getByText("3 items")).toBeInTheDocument();
    expect(screen.getByText("Folders")).toBeInTheDocument();
    expect(screen.getByText("2 folders")).toBeInTheDocument();
    expect(screen.getByText("app.ts")).toBeInTheDocument();
    expect(screen.getByText("components")).toBeInTheDocument();
  });

  it("does not fetch rich metadata for unsupported GitHub subroutes", () => {
    render(
      <GithubLinkPreview href="https://github.com/6529-Collections/6529Stream/settings" />
    );

    expect(screen.getAllByText("GitHub")).not.toHaveLength(0);
    expect(screen.getByText("settings")).toBeInTheDocument();
    expect(mockedFetchGithubPreview).not.toHaveBeenCalled();
  });

  it("keeps an issue card useful when status metadata fails", async () => {
    mockedFetchGithubPreview.mockRejectedValue(new Error("network"));

    render(
      <GithubLinkPreview href="https://github.com/6529-Collections/6529Stream/issues/392" />
    );

    await waitFor(() => {
      expect(screen.getByText("Status unavailable")).toBeInTheDocument();
    });

    expect(screen.getByText("Issue #392")).toBeInTheDocument();
    expect(
      screen.getByText("6529-Collections/6529Stream - issue #392")
    ).toBeInTheDocument();
  });
});
