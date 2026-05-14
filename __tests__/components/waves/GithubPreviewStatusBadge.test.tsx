import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

import GithubPreviewStatusBadge from "@/components/waves/GithubPreviewStatusBadge";

jest.mock("@heroicons/react/24/outline", () => ({
  SignalSlashIcon: (props: any) => <svg data-testid="signal-slash" {...props} />,
}));

jest.mock("@/components/utils/tooltip/CustomTooltip", () => ({
  __esModule: true,
  default: ({ children, content }: any) => (
    <span data-testid="custom-tooltip" data-content={content}>
      {children}
    </span>
  ),
}));

describe("GithubPreviewStatusBadge", () => {
  const originalFetch = global.fetch;
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("does not fetch for non GitHub URLs", () => {
    render(<GithubPreviewStatusBadge href="https://example.com/article" />);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("github-preview-status-badge")).toBeNull();
  });

  it("renders a loading badge while status metadata is pending", () => {
    fetchMock.mockImplementationOnce(() => new Promise(() => undefined));

    render(
      <GithubPreviewStatusBadge href="https://github.com/6529-Collections/6529seize-frontend/pull/2309" />
    );

    expect(screen.getByTestId("github-preview-status-badge")).toHaveTextContent(
      "Loading status"
    );
  });

  it("renders status immediately when OpenGraph metadata includes GitHub preview state", () => {
    render(
      <GithubPreviewStatusBadge
        href="https://github.com/6529-Collections/6529seize-frontend/pull/2309"
        initialPreview={{
          type: "github.pull_request",
          owner: "6529-Collections",
          repo: "6529seize-frontend",
          number: 2309,
          title: "Fix tab",
          state: "merged",
          reviewState: "none",
          mergeableState: "clean",
          merged: true,
          draft: false,
          url: "https://github.com/6529-Collections/6529seize-frontend/pull/2309",
        }}
      />
    );

    expect(screen.getByTestId("github-preview-status-badge")).toHaveTextContent(
      "Merged"
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renders issue completion state after the GitHub metadata request resolves", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        type: "github.issue",
        owner: "6529-Collections",
        repo: "6529seize-frontend",
        number: 2308,
        title: "Remove tab",
        state: "closed_completed",
        url: "https://github.com/6529-Collections/6529seize-frontend/issues/2308",
      }),
    });

    render(
      <GithubPreviewStatusBadge href="https://github.com/6529-Collections/6529seize-frontend/issues/2308" />
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("github-preview-status-badge")
      ).toHaveTextContent("Completed");
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/github-preview?url=https%3A%2F%2Fgithub.com%2F6529-Collections%2F6529seize-frontend%2Fissues%2F2308",
      expect.objectContaining({
        headers: { Accept: "application/json" },
      })
    );
  });

  it("renders pull request state details", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        type: "github.pull_request",
        owner: "6529-Collections",
        repo: "6529seize-frontend",
        number: 2309,
        title: "Fix tab",
        state: "open",
        reviewState: "none",
        mergeableState: "blocked",
        merged: false,
        draft: false,
        url: "https://github.com/6529-Collections/6529seize-frontend/pull/2309",
      }),
    });

    render(
      <GithubPreviewStatusBadge href="https://github.com/6529-Collections/6529seize-frontend/pull/2309" />
    );

    await waitFor(() => {
      const badge = screen.getByTestId("github-preview-status-badge");
      expect(badge).toHaveTextContent("Open");
      expect(badge).toHaveTextContent("blocked");
    });
  });

  it("prefers pull request review state over mergeability detail", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        type: "github.pull_request",
        owner: "6529-Collections",
        repo: "6529seize-frontend",
        number: 2310,
        title: "Reviewed",
        state: "open",
        reviewState: "approved",
        mergeableState: "blocked",
        merged: false,
        draft: false,
        url: "https://github.com/6529-Collections/6529seize-frontend/pull/2310",
      }),
    });

    render(
      <GithubPreviewStatusBadge href="https://github.com/6529-Collections/6529seize-frontend/pull/2310" />
    );

    await waitFor(() => {
      const badge = screen.getByTestId("github-preview-status-badge");
      expect(badge).toHaveTextContent("Approved");
      expect(badge).not.toHaveTextContent("blocked");
    });
  });

  it("renders an unavailable icon when status metadata cannot be loaded", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "boom" }),
    });

    render(
      <GithubPreviewStatusBadge href="https://github.com/6529-Collections/6529seize-frontend/pull/2311" />
    );

    await waitFor(() => {
      expect(screen.getByTestId("signal-slash")).toBeInTheDocument();
    });
    expect(screen.getByTestId("github-preview-status-badge")).toHaveAttribute(
      "title",
      "Status unavailable"
    );
    expect(screen.getByTestId("custom-tooltip")).toHaveAttribute(
      "data-content",
      "Status unavailable"
    );
  });
});
