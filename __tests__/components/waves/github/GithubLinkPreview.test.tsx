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
  });

  it("renders a compact PR card with inline status and no OpenGraph image", async () => {
    mockedFetchGithubPreview.mockResolvedValue({
      type: "github.pull_request",
      owner: "6529-Collections",
      repo: "6529Stream",
      number: 355,
      title: "[codex] Hydrate command reviews and expose PR costs",
      state: "merged",
      reviewState: "none",
      mergeableState: "clean",
      merged: true,
      draft: false,
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
    expect(card).not.toHaveClass("tw-h-[10rem]");
    expect(card).not.toHaveClass("md:tw-h-[11rem]");
    expect(screen.getByAltText("")).toHaveAttribute("src", "/github_w.png");

    const badge = screen.getByTestId("github-preview-status-badge");
    expect(badge).toHaveTextContent("Merged");
    expect(badge).toHaveClass("tw-relative");
    expect(badge).not.toHaveClass("tw-absolute");
    expect(screen.getByTestId("href-buttons")).toHaveAttribute(
      "data-href",
      "https://github.com/6529-Collections/6529Stream/pull/355"
    );
  });

  it("renders repository links without fetching PR or issue status", () => {
    render(
      <GithubLinkPreview href="https://github.com/6529-Collections/6529Stream" />
    );

    expect(screen.getByText("Repository")).toBeInTheDocument();
    expect(screen.getAllByText("6529-Collections/6529Stream")).toHaveLength(2);
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
