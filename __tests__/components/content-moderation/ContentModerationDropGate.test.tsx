import ContentModerationDropGate from "@/components/content-moderation/ContentModerationDropGate";
import ContentModerationDropBody from "@/components/content-moderation/ContentModerationDropBody";
import ContentModerationDropStatusControls from "@/components/content-moderation/ContentModerationDropStatusControls";
import ContentModerationReportStatusButton from "@/components/content-moderation/ContentModerationReportStatusButton";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiContentModerationReportStatus } from "@/generated/models/ApiContentModerationReportStatus";
import { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";
import {
  unblockProfile,
  unhideDrop,
} from "@/services/api/content-moderation-api";
import {
  getDropHiddenOverride,
  resetContentModerationStateForTests,
  setDropHiddenOverride,
  setProfileBlockedOverride,
} from "@/services/content-moderation/content-moderation-state";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

let mockConnectedProfileId: string | null = "viewer-1";

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: mockConnectedProfileId
      ? { id: mockConnectedProfileId, handle: "viewer" }
      : null,
    requestAuth: jest.fn().mockResolvedValue({ success: true }),
    setToast: jest.fn(),
  }),
}));

jest.mock("@/services/api/content-moderation-api", () => ({
  unblockProfile: jest.fn().mockResolvedValue(undefined),
  unhideDrop: jest.fn().mockResolvedValue(undefined),
}));

const renderGate = (element: ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { readonly children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(element, { wrapper: Wrapper });
};

const createDrop = (
  overrides: Partial<
    Pick<ApiDrop, "viewer_context" | "moderation" | "wave" | "created_at">
  > = {}
): ApiDrop =>
  ({
    id: "drop-1",
    created_at: 1_700_000_000_000,
    wave: {
      id: "wave-1",
      name: "Test wave",
      picture: null,
    } as ApiDrop["wave"],
    author: {
      id: "author-1",
      handle: "alice",
      pfp: null,
    } as ApiDrop["author"],
    ...overrides,
  }) as ApiDrop;

describe("ContentModerationDropGate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectedProfileId = "viewer-1";
    resetContentModerationStateForTests();
  });

  it("never exposes globally removed content", () => {
    renderGate(
      <ContentModerationDropGate
        drop={createDrop({
          moderation: {
            status: ApiDropModerationStatus.ModeratorRemoved,
            can_view: false,
          },
        })}
      >
        <p>Secret post content</p>
      </ContentModerationDropGate>
    );

    expect(screen.queryByText("Secret post content")).not.toBeInTheDocument();
    expect(
      screen.getByText("Content removed by moderators")
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Show post" })
    ).not.toBeInTheDocument();
  });

  it("preserves the post shell while replacing a removed body for chat drops", () => {
    renderGate(
      <ContentModerationDropGate
        drop={createDrop({
          viewer_context: {
            author_blocked: false,
            drop_hidden: false,
            report_status: ApiContentModerationReportStatus.ResolvedRemoved,
          },
          moderation: {
            status: ApiDropModerationStatus.ModeratorRemoved,
            can_view: false,
          },
        })}
        preserveGlobalContext
      >
        <div>
          <p>Author and timestamp shell</p>
          <ContentModerationReportStatusButton />
          <ContentModerationDropBody>
            <p>Removed secret body</p>
          </ContentModerationDropBody>
        </div>
      </ContentModerationDropGate>
    );

    expect(screen.getByText("Author and timestamp shell")).toBeInTheDocument();
    expect(screen.queryByText("Removed secret body")).not.toBeInTheDocument();
    expect(
      screen.getByText("Content removed by moderators")
    ).toBeInTheDocument();
    const reportStatus = screen.getByRole("button", {
      name: "Reviewed · Content removed",
    });
    expect(reportStatus).toHaveAttribute("title", "Reviewed · Content removed");

    fireEvent.click(reportStatus);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Report outcome" })
    ).toBeInTheDocument();
    expect(screen.getByText("Report reviewed")).toBeInTheDocument();
    expect(screen.getByText("Content removed")).toBeInTheDocument();
  });

  it("fails closed when a drop has no moderation presentation", () => {
    renderGate(
      <ContentModerationDropGate drop={createDrop()}>
        <p>Unclassified post content</p>
      </ContentModerationDropGate>
    );

    expect(
      screen.queryByText("Unclassified post content")
    ).not.toBeInTheDocument();
    const tombstoneMessage = screen.getByText(
      "This post is unavailable while it is being checked."
    );
    expect(tombstoneMessage).toBeInTheDocument();
    expect(tombstoneMessage).not.toHaveAttribute("role", "status");
  });

  it("allows authors to view their own moderated content", () => {
    mockConnectedProfileId = "author-1";
    renderGate(
      <ContentModerationDropGate
        drop={createDrop({
          moderation: {
            status: ApiDropModerationStatus.AiQuarantined,
            can_view: true,
          },
        })}
      >
        <p>Author post content</p>
      </ContentModerationDropGate>
    );

    expect(screen.getByText("Author post content")).toBeInTheDocument();
    expect(screen.getByText("This post is under review")).toBeInTheDocument();
    expect(screen.getByText("Only you can see this post.")).toBeInTheDocument();
    const notice = screen.getByTestId("content-moderation-author-notice");
    expect(notice).toHaveClass("tw-gap-1.5");
    expect(notice.querySelector("span")).toHaveClass(
      "tw-text-xs",
      "tw-leading-4"
    );
    expect(notice.querySelector("svg")).toHaveClass("tw-size-3.5");
  });

  it("fails closed when stale author-only moderation data reaches another viewer", () => {
    renderGate(
      <ContentModerationDropGate
        drop={createDrop({
          moderation: {
            status: ApiDropModerationStatus.ModeratorRemoved,
            can_view: true,
          },
        })}
      >
        <p>Stale author-only content</p>
      </ContentModerationDropGate>
    );

    expect(
      screen.queryByText("Stale author-only content")
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Content removed by moderators")
    ).toBeInTheDocument();
  });

  it("redacts author-only moderated content after the active profile changes", () => {
    mockConnectedProfileId = "author-1";
    const drop = createDrop({
      moderation: {
        status: ApiDropModerationStatus.ModeratorRemoved,
        can_view: true,
      },
    });
    const { rerender } = renderGate(
      <ContentModerationDropGate drop={drop}>
        <p>Author-only removed content</p>
      </ContentModerationDropGate>
    );

    expect(screen.getByText("Author-only removed content")).toBeInTheDocument();

    mockConnectedProfileId = "viewer-1";
    rerender(
      <ContentModerationDropGate drop={drop}>
        <p>Author-only removed content</p>
      </ContentModerationDropGate>
    );

    expect(
      screen.queryByText("Author-only removed content")
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Content removed by moderators")
    ).toBeInTheDocument();
  });

  it("keeps a removed compact tombstone actionable when navigation is available", () => {
    const onGlobalTombstoneClick = jest.fn();
    renderGate(
      <ContentModerationDropGate
        drop={createDrop({
          moderation: {
            status: ApiDropModerationStatus.ModeratorRemoved,
            can_view: false,
          },
        })}
        compact
        onGlobalTombstoneClick={onGlobalTombstoneClick}
      >
        <p>Removed quote content</p>
      </ContentModerationDropGate>
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Content removed by moderators. View original post",
      })
    );

    expect(onGlobalTombstoneClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Removed quote content")).not.toBeInTheDocument();
  });

  it("persists unhide for personally hidden content", async () => {
    mockConnectedProfileId = null;
    renderGate(
      <ContentModerationDropGate
        drop={createDrop({
          viewer_context: { author_blocked: false, drop_hidden: true },
          moderation: {
            status: ApiDropModerationStatus.Visible,
            can_view: true,
          },
        })}
      >
        <p>Personally hidden post</p>
      </ContentModerationDropGate>
    );

    const hiddenContent = screen.getByTestId(
      "content-moderation-hidden-content"
    );
    expect(hiddenContent).toHaveAttribute("aria-hidden", "true");
    expect(hiddenContent).toHaveAttribute("inert");
    expect(hiddenContent).toHaveClass("tw-blur-[6px]");
    expect(screen.getByText("Personally hidden post")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reveal" })).toHaveAttribute(
      "title",
      "Show temporarily"
    );
    fireEvent.click(screen.getByRole("button", { name: "Unhide" }));
    expect(
      screen.queryByTestId("content-moderation-tombstone-hidden")
    ).not.toBeInTheDocument();
    await waitFor(() => expect(unhideDrop).toHaveBeenCalledWith("drop-1"));
    expect(
      await screen.findByText("Personally hidden post")
    ).toBeInTheDocument();
  });

  it("reveals a hidden post locally and offers hide again without changing its saved state", () => {
    renderGate(
      <ContentModerationDropGate
        drop={createDrop({
          viewer_context: { author_blocked: false, drop_hidden: true },
          moderation: {
            status: ApiDropModerationStatus.Visible,
            can_view: true,
          },
        })}
      >
        <div>
          <ContentModerationDropStatusControls />
          <p>Temporarily revealed hidden post</p>
        </div>
      </ContentModerationDropGate>
    );

    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));

    expect(
      screen.queryByTestId("content-moderation-tombstone-hidden")
    ).not.toBeInTheDocument();
    expect(screen.getByText("Temporarily revealed hidden post")).toBeVisible();
    expect(screen.getByRole("button", { name: "Hide again" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Unhide" })).toBeVisible();
    expect(unhideDrop).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Hide again" }));

    expect(
      screen.getByTestId("content-moderation-tombstone-hidden")
    ).toBeInTheDocument();
    expect(unhideDrop).not.toHaveBeenCalled();
  });

  it("shows the resolved no-action outcome before and after reveal", () => {
    renderGate(
      <ContentModerationDropGate
        drop={createDrop({
          viewer_context: {
            author_blocked: false,
            drop_hidden: true,
            report_status: ApiContentModerationReportStatus.ResolvedAllowed,
          },
          moderation: {
            status: ApiDropModerationStatus.Visible,
            can_view: true,
          },
        })}
      >
        <div>
          <ContentModerationDropStatusControls />
          <p>Reviewed post</p>
        </div>
      </ContentModerationDropGate>
    );

    expect(
      screen.getByRole("button", { name: "Reviewed · No action taken" })
    ).toHaveTextContent("Reviewed · No action taken");

    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));

    expect(
      screen.getByRole("button", { name: "Reviewed · No action taken" })
    ).toHaveTextContent("Reviewed · No action taken");
    expect(screen.getByRole("button", { name: "Hide again" })).toBeVisible();
  });

  it("does not repeat Hidden when a hidden post already has report status", () => {
    renderGate(
      <ContentModerationDropGate
        drop={createDrop({
          viewer_context: {
            author_blocked: false,
            drop_hidden: true,
            report_status: ApiContentModerationReportStatus.Open,
          },
          moderation: {
            status: ApiDropModerationStatus.Visible,
            can_view: true,
          },
        })}
      >
        <p>Reported and hidden post</p>
      </ContentModerationDropGate>
    );

    expect(
      screen.getByRole("button", { name: "Reported · Awaiting review" })
    ).toBeVisible();
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reveal" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Unhide" })).toBeVisible();
  });

  it("restores the exact hidden override when unhide fails", async () => {
    jest.mocked(unhideDrop).mockRejectedValueOnce(new Error("request failed"));
    renderGate(
      <ContentModerationDropGate
        drop={createDrop({
          viewer_context: { author_blocked: false, drop_hidden: true },
          moderation: {
            status: ApiDropModerationStatus.Visible,
            can_view: true,
          },
        })}
      >
        <p>Hidden after failed unhide</p>
      </ContentModerationDropGate>
    );

    fireEvent.click(screen.getByRole("button", { name: "Unhide" }));
    expect(
      screen.queryByTestId("content-moderation-tombstone-hidden")
    ).not.toBeInTheDocument();

    await waitFor(() =>
      expect(
        screen.getByTestId("content-moderation-tombstone-hidden")
      ).toBeInTheDocument()
    );
    expect(getDropHiddenOverride("viewer-1", "drop-1")).toBeUndefined();
  });

  it("does not carry a temporary reveal across profile switches", () => {
    setProfileBlockedOverride("viewer-1", "author-1", true);
    setProfileBlockedOverride("viewer-2", "author-1", true);
    const drop = createDrop({
      moderation: {
        status: ApiDropModerationStatus.Visible,
        can_view: true,
      },
    });
    const { rerender } = renderGate(
      <ContentModerationDropGate drop={drop}>
        <p>Blocked author post</p>
      </ContentModerationDropGate>
    );

    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));
    expect(screen.getByText("Blocked author post")).toBeInTheDocument();

    mockConnectedProfileId = "viewer-2";
    rerender(
      <ContentModerationDropGate drop={drop}>
        <p>Blocked author post</p>
      </ContentModerationDropGate>
    );

    expect(
      screen.getByTestId("content-moderation-tombstone-blocked")
    ).toBeInTheDocument();
    expect(screen.getByText("Blocked author post")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open @alice's profile" })
    ).toHaveAttribute("href", "/alice");
  });

  it("ends a blocked-post reveal when the viewer hides that post", () => {
    setProfileBlockedOverride("viewer-1", "author-1", true);
    renderGate(
      <ContentModerationDropGate
        drop={createDrop({
          moderation: {
            status: ApiDropModerationStatus.Visible,
            can_view: true,
          },
        })}
      >
        <p>Temporarily revealed post</p>
      </ContentModerationDropGate>
    );

    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));
    expect(screen.getByText("Temporarily revealed post")).toBeInTheDocument();

    act(() => setDropHiddenOverride("viewer-1", "drop-1", true));

    expect(screen.getByText("Temporarily revealed post")).toBeInTheDocument();
    expect(
      screen.getByTestId("content-moderation-tombstone-blocked")
    ).toBeInTheDocument();
  });

  it("unblocks every mounted post by an author immediately", async () => {
    setProfileBlockedOverride("viewer-1", "author-1", true);
    const firstDrop = createDrop({
      moderation: {
        status: ApiDropModerationStatus.Visible,
        can_view: true,
      },
    });
    const secondDrop = { ...firstDrop, id: "drop-2" };
    renderGate(
      <>
        <ContentModerationDropGate drop={firstDrop}>
          <p>First blocked post</p>
        </ContentModerationDropGate>
        <ContentModerationDropGate drop={secondDrop}>
          <p>Second blocked post</p>
        </ContentModerationDropGate>
      </>
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Unblock" })[0]!);

    expect(
      screen.queryByTestId("content-moderation-tombstone-blocked")
    ).not.toBeInTheDocument();
    expect(screen.getByText("First blocked post")).toBeVisible();
    expect(screen.getByText("Second blocked post")).toBeVisible();
    await waitFor(() =>
      expect(unblockProfile).toHaveBeenCalledWith("author-1")
    );
  });

  it("keeps blocked Brain activity at full height and supports reveal then hide again", () => {
    setProfileBlockedOverride("viewer-1", "author-1", true);
    renderGate(
      <ContentModerationDropGate
        drop={createDrop({
          moderation: {
            status: ApiDropModerationStatus.Visible,
            can_view: true,
          },
        })}
        presentation="profile-activity"
      >
        <p>Compact blocked post content</p>
      </ContentModerationDropGate>
    );

    expect(
      screen.getByTestId("content-moderation-profile-activity-blocked")
    ).toBeInTheDocument();
    expect(screen.getByText("Test wave")).toBeInTheDocument();
    expect(screen.queryByText("@alice")).not.toBeInTheDocument();
    expect(screen.getByTestId("content-moderation-hidden-content")).toHaveClass(
      "tw-blur-[6px]"
    );
    expect(
      screen.getByText("Compact blocked post content")
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Unblock" })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));

    expect(
      screen.getByTestId("content-moderation-profile-activity-blocked")
    ).toBeInTheDocument();
    expect(screen.getByText("Compact blocked post content")).toBeVisible();
    expect(
      screen.getByTestId("content-moderation-revealed-content")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Hide again" }));

    expect(screen.getByTestId("content-moderation-hidden-content")).toHaveClass(
      "tw-blur-[6px]"
    );
  });
});
