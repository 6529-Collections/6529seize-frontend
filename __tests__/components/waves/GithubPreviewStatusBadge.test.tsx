import { act, render, screen, waitFor } from "@testing-library/react";
import React from "react";

import GithubPreviewStatusBadge from "@/components/waves/GithubPreviewStatusBadge";
import type { GithubPreviewResponse } from "@/services/api/github-preview-api";

jest.mock("@heroicons/react/24/outline", () => ({
  SignalSlashIcon: (props: any) => (
    <svg data-testid="signal-slash" {...props} />
  ),
}));

jest.mock("@/components/utils/tooltip/CustomTooltip", () => ({
  __esModule: true,
  default: ({ children, content }: any) => (
    <span data-testid="custom-tooltip" data-content={content}>
      {children}
    </span>
  ),
}));

const createDomRect = (): DOMRectReadOnly => ({
  bottom: 0,
  height: 0,
  left: 0,
  right: 0,
  top: 0,
  width: 0,
  x: 0,
  y: 0,
  toJSON: () => ({}),
});

const createIntersectionEntry = (
  isIntersecting: boolean
): IntersectionObserverEntry => ({
  boundingClientRect: createDomRect(),
  intersectionRatio: isIntersecting ? 1 : 0,
  intersectionRect: createDomRect(),
  isIntersecting,
  rootBounds: null,
  target: document.createElement("span"),
  time: 0,
});

const createBatchResponse = (
  href: string,
  preview: GithubPreviewResponse
): Response =>
  ({
    ok: true,
    json: async () => ({
      results: [{ url: href, preview }],
      errors: [],
    }),
  }) as Response;

describe("GithubPreviewStatusBadge", () => {
  const originalFetch = globalThis.fetch;
  const originalIntersectionObserver = globalThis.IntersectionObserver;
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    jest.useRealTimers();
    globalThis.IntersectionObserver = originalIntersectionObserver;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it("does not fetch for non GitHub URLs", () => {
    render(<GithubPreviewStatusBadge href="https://example.com/article" />);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("github-preview-status-badge")).toBeNull();
  });

  it("renders a loading badge while status metadata is pending", async () => {
    fetchMock.mockImplementationOnce(() => new Promise(() => undefined));

    render(
      <GithubPreviewStatusBadge href="https://github.com/6529-Collections/6529seize-frontend/pull/2309" />
    );

    expect(screen.getByTestId("github-preview-status-badge")).toHaveTextContent(
      "Loading status"
    );
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
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
    expect(screen.getByTestId("github-preview-repo-label")).toHaveTextContent(
      "Frontend"
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renders a known 6529 repository label for easier scanning", () => {
    render(
      <GithubPreviewStatusBadge
        href="https://github.com/6529-Collections/6529seize-backend/issues/1661"
        initialPreview={{
          type: "github.issue",
          owner: "6529-Collections",
          repo: "6529seize-backend",
          number: 1661,
          title: "Backend issue",
          state: "closed_completed",
          assignees: [],
          url: "https://github.com/6529-Collections/6529seize-backend/issues/1661",
        }}
      />
    );

    expect(screen.getByTestId("github-preview-repo-label")).toHaveTextContent(
      "Backend"
    );
    expect(screen.getByTestId("github-preview-status-badge")).toHaveAttribute(
      "aria-label",
      "6529-Collections/6529seize-backend: Completed · Unassigned"
    );
  });

  it("renders issue completion state after the GitHub metadata request resolves", async () => {
    const href =
      "https://github.com/6529-Collections/6529seize-frontend/issues/2308";
    fetchMock.mockResolvedValueOnce(
      createBatchResponse(href, {
        type: "github.issue",
        owner: "6529-Collections",
        repo: "6529seize-frontend",
        number: 2308,
        title: "Remove tab",
        state: "closed_completed",
        assignees: ["alice"],
        url: href,
      })
    );

    render(<GithubPreviewStatusBadge href={href} />);

    await waitFor(() => {
      expect(screen.getByTestId("github-preview-status-badge")).toHaveAttribute(
        "aria-label",
        "6529-Collections/6529seize-frontend: Completed · @alice"
      );
    });
    expect(
      screen.getByTestId("github-preview-assignee-label")
    ).toHaveTextContent("@alice");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/github-preview",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          urls: [href],
        }),
      })
    );
  });

  it("renders unassigned for issue previews without an assignee", () => {
    render(
      <GithubPreviewStatusBadge
        href="https://github.com/6529-Collections/6529seize-frontend/issues/2308"
        initialPreview={{
          type: "github.issue",
          owner: "6529-Collections",
          repo: "6529seize-frontend",
          number: 2308,
          title: "Remove tab",
          state: "open",
          assignees: [],
          url: "https://github.com/6529-Collections/6529seize-frontend/issues/2308",
        }}
      />
    );

    expect(screen.getByTestId("github-preview-status-badge")).toHaveAttribute(
      "aria-label",
      "6529-Collections/6529seize-frontend: Open · Unassigned"
    );
    expect(
      screen.getByTestId("github-preview-assignee-label")
    ).toHaveTextContent("Unassigned");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renders one mobile assignee and both desktop assignees for two assignees", () => {
    render(
      <GithubPreviewStatusBadge
        href="https://github.com/6529-Collections/6529seize-frontend/issues/2314"
        initialPreview={{
          type: "github.issue",
          owner: "6529-Collections",
          repo: "6529seize-frontend",
          number: 2314,
          title: "Multi owner",
          state: "open",
          assignees: ["alice", "bob"],
          url: "https://github.com/6529-Collections/6529seize-frontend/issues/2314",
        }}
      />
    );

    expect(
      screen.getByTestId("github-preview-assignee-mobile-label")
    ).toHaveTextContent("@alice +1");
    expect(
      screen.getByTestId("github-preview-assignee-desktop-label")
    ).toHaveTextContent("@alice, @bob");
    expect(screen.getByTestId("github-preview-status-badge")).toHaveAttribute(
      "aria-label",
      "6529-Collections/6529seize-frontend: Open · @alice, @bob"
    );
  });

  it("renders a compact count for issue previews with more than two assignees", () => {
    render(
      <GithubPreviewStatusBadge
        href="https://github.com/6529-Collections/6529seize-frontend/issues/2315"
        initialPreview={{
          type: "github.issue",
          owner: "6529-Collections",
          repo: "6529seize-frontend",
          number: 2315,
          title: "Multi owner",
          state: "open",
          assignees: ["alice", "bob", "carol"],
          url: "https://github.com/6529-Collections/6529seize-frontend/issues/2315",
        }}
      />
    );

    expect(
      screen.getByTestId("github-preview-assignee-label")
    ).toHaveTextContent("@alice +2");
  });

  it("does not render an assignee badge for pull request previews", () => {
    render(
      <GithubPreviewStatusBadge
        href="https://github.com/6529-Collections/6529seize-frontend/pull/2309"
        initialPreview={{
          type: "github.pull_request",
          owner: "6529-Collections",
          repo: "6529seize-frontend",
          number: 2309,
          title: "Fix tab",
          state: "open",
          reviewState: "none",
          mergeableState: "clean",
          merged: false,
          draft: false,
          url: "https://github.com/6529-Collections/6529seize-frontend/pull/2309",
        }}
      />
    );

    expect(screen.getByTestId("github-preview-status-badge")).toHaveTextContent(
      "Open"
    );
    expect(screen.queryByTestId("github-preview-assignee-label")).toBeNull();
  });

  it("does not fetch status until the badge enters the viewport", async () => {
    const href =
      "https://github.com/6529-Collections/6529seize-frontend/issues/2312";
    let triggerIntersection = (_isIntersecting: boolean) => {};
    class TestIntersectionObserver implements IntersectionObserver {
      readonly root = null;
      readonly rootMargin = "";
      readonly thresholds = [0.1];

      constructor(callback: IntersectionObserverCallback) {
        triggerIntersection = (isIntersecting: boolean) => {
          callback([createIntersectionEntry(isIntersecting)], this);
        };
      }

      disconnect = jest.fn();
      observe = jest.fn();
      takeRecords = jest.fn(() => []);
      unobserve = jest.fn();
    }
    globalThis.IntersectionObserver = TestIntersectionObserver;
    fetchMock.mockResolvedValueOnce(
      createBatchResponse(href, {
        type: "github.issue",
        owner: "6529-Collections",
        repo: "6529seize-frontend",
        number: 2312,
        title: "Remove tab",
        state: "closed_completed",
        assignees: [],
        url: href,
      })
    );

    render(<GithubPreviewStatusBadge href={href} />);

    expect(fetchMock).not.toHaveBeenCalled();

    act(() => {
      triggerIntersection(true);
    });

    await waitFor(() => {
      expect(
        screen.getByTestId("github-preview-status-badge")
      ).toHaveTextContent("Completed");
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("renders pull request state details", async () => {
    const href =
      "https://github.com/6529-Collections/6529seize-frontend/pull/2312";
    fetchMock.mockResolvedValueOnce(
      createBatchResponse(href, {
        type: "github.pull_request",
        owner: "6529-Collections",
        repo: "6529seize-frontend",
        number: 2312,
        title: "Fix tab",
        state: "open",
        reviewState: "none",
        mergeableState: "blocked",
        merged: false,
        draft: false,
        url: href,
      })
    );

    render(<GithubPreviewStatusBadge href={href} />);

    await waitFor(() => {
      const badge = screen.getByTestId("github-preview-status-badge");
      expect(badge).toHaveTextContent("Open");
      expect(badge).toHaveTextContent("blocked");
    });
  });

  it("refreshes visible badges every minute without client or server cache", async () => {
    jest.useFakeTimers();
    const href =
      "https://github.com/6529-Collections/6529seize-frontend/pull/2313";
    fetchMock
      .mockResolvedValueOnce(
        createBatchResponse(href, {
          type: "github.pull_request",
          owner: "6529-Collections",
          repo: "6529seize-frontend",
          number: 2313,
          title: "Fix tab",
          state: "open",
          reviewState: "none",
          mergeableState: "clean",
          merged: false,
          draft: false,
          url: href,
        })
      )
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: "github.pull_request",
          owner: "6529-Collections",
          repo: "6529seize-frontend",
          number: 2313,
          title: "Fix tab",
          state: "open",
          reviewState: "approved",
          mergeableState: "clean",
          merged: false,
          draft: false,
          url: href,
        }),
      });

    render(<GithubPreviewStatusBadge href={href} />);

    await waitFor(() => {
      expect(
        screen.getByTestId("github-preview-status-badge")
      ).toHaveTextContent("Open");
    });

    await act(async () => {
      jest.advanceTimersByTime(30 * 1000);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(
        screen.getByTestId("github-preview-status-badge")
      ).toHaveTextContent("Approved");
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toContain("refresh=1");
    expect(fetchMock.mock.calls[1]?.[0]).toContain("ts=");
  });

  it("prefers pull request review state over mergeability detail", async () => {
    const href =
      "https://github.com/6529-Collections/6529seize-frontend/pull/2310";
    fetchMock.mockResolvedValueOnce(
      createBatchResponse(href, {
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
        url: href,
      })
    );

    render(<GithubPreviewStatusBadge href={href} />);

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
      "aria-label",
      "6529-Collections/6529seize-frontend: Status unavailable"
    );
    expect(
      screen.getByTestId("github-preview-status-badge")
    ).not.toHaveAttribute("title");
    expect(screen.getByTestId("custom-tooltip")).toHaveAttribute(
      "data-content",
      "Status unavailable"
    );
  });
});
