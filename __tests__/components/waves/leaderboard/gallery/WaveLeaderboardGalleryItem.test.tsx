import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WaveLeaderboardGalleryItem } from "@/components/waves/leaderboard/gallery/WaveLeaderboardGalleryItem";
import { ApiWaveParticipationSubmissionStrategyType } from "@/generated/models/ApiWaveParticipationSubmissionStrategyType";
import { useDropVoteLogs } from "@/hooks/useDropVoteLogs";
import { useDropVoters } from "@/hooks/useDropVoters";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { DEFAULT_LONG_PRESS_DURATION_MS } from "@/hooks/useLongPressInteraction";

jest.mock(
  "@/components/drops/view/item/content/media/MediaDisplay",
  () => (props: any) => (
    <div
      data-testid="media"
      data-url={props.media_url}
      data-preview-image-url={props.previewImageUrl ?? ""}
      data-inert-preview={String(props.isInertPreview)}
    />
  )
);
jest.mock(
  "@/components/waves/leaderboard/gallery/WaveLeaderboardGalleryItemVotes",
  () => (props: any) => (
    <div
      data-testid="votes"
      data-variant={props.variant}
      data-winning-threshold={props.winningThreshold ?? ""}
      data-winning-threshold-min-duration={
        props.winningThresholdMinDurationMs ?? ""
      }
      data-is-voting-closed={String(props.isVotingClosed)}
    />
  )
);
jest.mock(
  "@/components/waves/leaderboard/identity/WaveLeaderboardIdentity",
  () => ({
    WaveLeaderboardIdentity: ({ drop, variant }: any) =>
      drop.wave?.submission_type === "IDENTITY" ? (
        <div data-testid="identity" data-variant={variant} />
      ) : null,
  })
);
jest.mock("@/components/waves/drops/winner/WinnerDropBadge", () => () => (
  <div data-testid="badge" />
));
let mockVotingModalInline = false;
jest.mock("@/components/voting", () => {
  const { createPortal } = jest.requireActual("react-dom");
  return {
    VotingModal: (props: { readonly isOpen: boolean }) => {
      const content = (
        <div
          data-testid="modal"
          data-open={props.isOpen}
          role={props.isOpen ? "dialog" : undefined}
          aria-label="Voting"
        />
      );
      return mockVotingModalInline
        ? content
        : createPortal(content, document.body);
    },
    MobileVotingModal: (props: { readonly isOpen: boolean }) =>
      createPortal(
        <div data-testid="mobile-modal" data-open={props.isOpen} />,
        document.body
      ),
  };
});
jest.mock("@/components/voting/VotingModalButton", () => (props: any) => (
  <button
    data-testid="vote-btn"
    onClick={props.onClick}
    className={props.className}
  >
    {props.children ?? "Vote"}
  </button>
));
jest.mock("@/hooks/isMobileScreen", () => () => false);
jest.mock("@/hooks/useIsTouchDevice");
jest.mock("@/hooks/useDeviceInfo");
jest.mock("@/hooks/useDropVoters");
jest.mock("@/hooks/useDropVoteLogs");
jest.mock("@/hooks/useIntersectionObserver", () => ({
  useIntersectionObserver: () => ({ current: null }),
}));
jest.mock("@/components/utils/tooltip/UserProfileTooltipWrapper", () => ({
  __esModule: true,
  default: ({ children }: { readonly children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
jest.mock("@/hooks/drops/useDropInteractionRules", () => ({
  useDropInteractionRules: () => ({ canShowVote: true }),
}));
jest.mock("@/helpers/image.helpers", () => ({
  getScaledImageUri: (u: string) => `scaled:${u}`,
  ImageScale: { AUTOx450: "x", AUTOx1080: "y" },
}));

const mockMenuOpen = jest.fn();
jest.mock(
  "@/components/waves/leaderboard/grid/WaveLeaderboardGridItemMobileActionsMenu",
  () => ({
    WaveLeaderboardGridItemMobileActionsMenu: (props: any) => {
      const { createPortal } = jest.requireActual("react-dom");
      return props.isOpen
        ? createPortal(
            <div role="dialog" aria-label="Artwork actions">
              <button onClick={() => props.setIsActive(false)}>
                Dismiss actions
              </button>
              <button
                onClick={() => {
                  mockMenuOpen();
                  props.setIsActive(false);
                }}
              >
                Open from actions
              </button>
            </div>,
            document.body
          )
        : null;
    },
  })
);

const mockUseDropVoters = useDropVoters as jest.Mock;
const mockUseDropVoteLogs = useDropVoteLogs as jest.Mock;
const mockUseIsTouchDevice = useIsTouchDevice as jest.Mock;
const mockUseDeviceInfo = useDeviceInfo as jest.Mock;

describe("WaveLeaderboardGalleryItem", () => {
  const drop: any = {
    id: "d1",
    metadata: [],
    parts: [{ media: [{ url: "img", mime_type: "image/png" }] }],
    raters_count: 3,
    rank: 1,
    wave: { id: "w1", voting_credit_type: "NIC", submission_type: null },
    context_profile_context: { rating: 1 },
    author: { handle: "alice" },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockVotingModalInline = false;
    mockUseDeviceInfo.mockReturnValue({ hasTouchScreen: false, isApp: false });
    mockUseIsTouchDevice.mockReturnValue(false);
    mockUseDropVoters.mockReturnValue({
      voters: [],
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    mockUseDropVoteLogs.mockReturnValue({
      logs: [],
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("handles click and keyboard events", async () => {
    const onDropClick = jest.fn();
    render(
      <WaveLeaderboardGalleryItem drop={drop} onDropClick={onDropClick} />
    );
    const mainButton = screen.getByRole("button", {
      name: "Open Untitled drop",
    });
    expect(mainButton).not.toHaveClass("tw-touch-none");
    await userEvent.click(mainButton);
    expect(onDropClick).toHaveBeenCalledWith(drop);
    mainButton.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(onDropClick).toHaveBeenCalledTimes(3);
    expect(mainButton.querySelector("a, button")).toBeNull();
  });

  it("names the card-open action after the artwork", () => {
    render(
      <WaveLeaderboardGalleryItem
        drop={{ ...drop, title: "A New Beginning" }}
        onDropClick={jest.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: "Open A New Beginning" })
    ).toBeInTheDocument();
  });

  it.each([
    { environment: "touch browser", hasTouchScreen: true, isApp: false },
    { environment: "desktop browser", hasTouchScreen: false, isApp: false },
    { environment: "app without touch", hasTouchScreen: false, isApp: true },
  ])(
    "keeps the author and static-media targets independent in $environment",
    async ({ hasTouchScreen, isApp }) => {
      mockUseDeviceInfo.mockReturnValue({ hasTouchScreen, isApp });
      const onDropClick = jest.fn();
      render(
        <WaveLeaderboardGalleryItem drop={drop} onDropClick={onDropClick} />
      );
      const authorLink = screen.getByRole("link", {
        name: "View alice's profile",
      });

      expect(authorLink).toHaveAttribute("href", "/alice");
      expect(authorLink).toHaveClass("tw-block", "tw-max-w-full");
      expect(authorLink).not.toHaveClass("tw-w-fit");
      expect(authorLink.closest("button")).toBeNull();
      expect(screen.getByTestId("media").closest("[inert]")).toBeNull();
      expect(screen.getByTestId("media")).toHaveAttribute(
        "data-inert-preview",
        "false"
      );
      expect(screen.getByTestId("media").closest("button")).toBe(
        screen.getByRole("button", { name: "Open Untitled drop" })
      );
      await userEvent.click(authorLink);

      expect(onDropClick).not.toHaveBeenCalled();
    }
  );

  it.each([
    { environment: "desktop browser", hasTouchScreen: false },
    { environment: "touch browser", hasTouchScreen: true },
  ])(
    "preserves a whitespace-only title in the $environment",
    ({ hasTouchScreen }) => {
      mockUseDeviceInfo.mockReturnValue({ hasTouchScreen, isApp: false });
      render(
        <WaveLeaderboardGalleryItem
          drop={{ ...drop, title: "   " }}
          onDropClick={jest.fn()}
        />
      );

      expect(screen.getByRole("heading", { level: 3 }).textContent).toBe("   ");
      expect(screen.queryByText("Untitled drop")).not.toBeInTheDocument();
    }
  );

  it("uses the fallback for a whitespace-only native-touch title", () => {
    mockUseDeviceInfo.mockReturnValue({ hasTouchScreen: true, isApp: true });
    render(
      <WaveLeaderboardGalleryItem
        drop={{ ...drop, title: "   " }}
        onDropClick={jest.fn()}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Untitled drop" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open Untitled drop" })
    ).toBeInTheDocument();
  });

  it.each(["image/png", "video/mp4"])(
    "uses one native-touch open action for author and %s previews",
    async (mimeType) => {
      mockUseDeviceInfo.mockReturnValue({ hasTouchScreen: true, isApp: true });
      const onDropClick = jest.fn();
      const nativeDrop = {
        ...drop,
        title: "Native artwork",
        parts: [{ media: [{ url: "artwork", mime_type: mimeType }] }],
      };
      render(
        <WaveLeaderboardGalleryItem
          drop={nativeDrop}
          onDropClick={onDropClick}
        />
      );

      expect(screen.getByText("alice").tagName).toBe("SPAN");
      expect(
        screen.queryByRole("link", { name: "View alice's profile" })
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("media").closest("[inert]")).not.toBeNull();
      expect(screen.getByTestId("media")).toHaveAttribute(
        "data-inert-preview",
        "true"
      );
      expect(
        screen.queryByRole("button", { name: "Open drop media" })
      ).not.toBeInTheDocument();
      const primaryButton = screen.getByRole("button", {
        name: "Open Native artwork",
      });
      expect(primaryButton.querySelector("a, button")).toBeNull();

      // Physical-device coverage verifies author/media hits reach the sibling primary button.
      await userEvent.click(primaryButton);
      expect(onDropClick).toHaveBeenCalledWith(nativeDrop);
      await userEvent.click(screen.getByTestId("vote-btn"));
      expect(onDropClick).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("modal")).toHaveAttribute("data-open", "true");
    }
  );

  it("does not add a long-press menu to touch-browser cards", () => {
    jest.useFakeTimers();
    mockUseDeviceInfo.mockReturnValue({ hasTouchScreen: true, isApp: false });
    const onDropClick = jest.fn();
    render(
      <WaveLeaderboardGalleryItem drop={drop} onDropClick={onDropClick} />
    );
    const mainButton = screen.getByRole("button", {
      name: "Open Untitled drop",
    });

    fireEvent.touchStart(mainButton, {
      touches: [{ clientX: 10, clientY: 10 }],
    });
    act(() => jest.advanceTimersByTime(DEFAULT_LONG_PRESS_DURATION_MS));
    fireEvent.touchEnd(mainButton);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(mainButton);
    expect(onDropClick).toHaveBeenCalledTimes(1);
  });

  it.each(["portaled", "inline"])(
    "does not start the card long press from a %s voting dialog",
    (rendering) => {
      jest.useFakeTimers();
      mockVotingModalInline = rendering === "inline";
      mockUseDeviceInfo.mockReturnValue({ hasTouchScreen: true, isApp: true });
      const onDropClick = jest.fn();
      render(
        <WaveLeaderboardGalleryItem drop={drop} onDropClick={onDropClick} />
      );
      fireEvent.click(screen.getByTestId("vote-btn"));
      const modal = screen.getByTestId("modal");
      expect(modal).toHaveAttribute("data-open", "true");

      fireEvent.touchStart(modal, {
        touches: [{ clientX: 10, clientY: 10 }],
      });
      act(() => jest.advanceTimersByTime(DEFAULT_LONG_PRESS_DURATION_MS));
      fireEvent.touchEnd(modal);

      expect(
        screen.queryByRole("dialog", { name: "Artwork actions" })
      ).not.toBeInTheDocument();
      expect(onDropClick).not.toHaveBeenCalled();
    }
  );

  it("preserves long press, suppresses its release click, and allows a fresh tap after dismissal", () => {
    jest.useFakeTimers();
    mockUseDeviceInfo.mockReturnValue({ hasTouchScreen: true, isApp: true });
    const onDropClick = jest.fn();
    render(
      <WaveLeaderboardGalleryItem drop={drop} onDropClick={onDropClick} />
    );
    const mainButton = screen.getByRole("button", {
      name: "Open Untitled drop",
    });

    fireEvent.touchStart(mainButton, {
      touches: [{ clientX: 10, clientY: 10 }],
    });
    act(() => jest.advanceTimersByTime(DEFAULT_LONG_PRESS_DURATION_MS));
    expect(
      screen.getByRole("dialog", { name: "Artwork actions" })
    ).toBeInTheDocument();
    fireEvent.touchEnd(mainButton);
    fireEvent.click(mainButton);
    expect(onDropClick).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Dismiss actions" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.touchStart(mainButton, {
      touches: [{ clientX: 10, clientY: 10 }],
    });
    fireEvent.touchEnd(mainButton);
    fireEvent.click(mainButton);

    expect(onDropClick).toHaveBeenCalledTimes(1);
  });

  it("cancels the pending long press when a second finger touches the card", () => {
    jest.useFakeTimers();
    mockUseDeviceInfo.mockReturnValue({ hasTouchScreen: true, isApp: true });
    const onDropClick = jest.fn();
    render(
      <WaveLeaderboardGalleryItem drop={drop} onDropClick={onDropClick} />
    );
    const mainButton = screen.getByRole("button", {
      name: "Open Untitled drop",
    });
    const firstTouch = { identifier: 1, clientX: 10, clientY: 10 };
    const secondTouch = { identifier: 2, clientX: 30, clientY: 10 };

    fireEvent.touchStart(mainButton, { touches: [firstTouch] });
    act(() => jest.advanceTimersByTime(100));
    fireEvent.touchStart(mainButton, {
      touches: [firstTouch, secondTouch],
      changedTouches: [secondTouch],
    });
    fireEvent.touchEnd(mainButton, {
      touches: [firstTouch],
      changedTouches: [secondTouch],
    });
    fireEvent.touchEnd(mainButton, {
      touches: [],
      changedTouches: [firstTouch],
    });
    act(() => jest.advanceTimersByTime(DEFAULT_LONG_PRESS_DURATION_MS));
    fireEvent.click(mainButton, { detail: 1 });

    expect(
      screen.queryByRole("dialog", { name: "Artwork actions" })
    ).not.toBeInTheDocument();
    expect(onDropClick).not.toHaveBeenCalled();

    fireEvent.touchStart(mainButton, { touches: [firstTouch] });
    act(() => jest.advanceTimersByTime(DEFAULT_LONG_PRESS_DURATION_MS));
    expect(
      screen.getByRole("dialog", { name: "Artwork actions" })
    ).toBeInTheDocument();
    fireEvent.touchEnd(mainButton, {
      touches: [],
      changedTouches: [firstTouch],
    });
  });

  it("does not suppress the first action in the portaled long-press menu", () => {
    jest.useFakeTimers();
    mockUseDeviceInfo.mockReturnValue({ hasTouchScreen: true, isApp: true });
    const onDropClick = jest.fn();
    render(
      <WaveLeaderboardGalleryItem drop={drop} onDropClick={onDropClick} />
    );
    const mainButton = screen.getByRole("button", {
      name: "Open Untitled drop",
    });

    fireEvent.touchStart(mainButton, {
      touches: [{ clientX: 10, clientY: 10 }],
    });
    act(() => jest.advanceTimersByTime(DEFAULT_LONG_PRESS_DURATION_MS));
    fireEvent.touchEnd(mainButton);
    fireEvent.click(screen.getByRole("button", { name: "Open from actions" }));

    expect(mockMenuOpen).toHaveBeenCalledTimes(1);
    expect(onDropClick).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("cancels long-press detection when the user scrolls", () => {
    jest.useFakeTimers();
    mockUseDeviceInfo.mockReturnValue({ hasTouchScreen: true, isApp: true });
    const onDropClick = jest.fn();
    render(
      <WaveLeaderboardGalleryItem drop={drop} onDropClick={onDropClick} />
    );
    const mainButton = screen.getByRole("button", {
      name: "Open Untitled drop",
    });

    expect(
      fireEvent.touchStart(mainButton, {
        touches: [{ clientX: 10, clientY: 100 }],
        cancelable: true,
      })
    ).toBe(true);
    expect(
      fireEvent.touchMove(mainButton, {
        touches: [{ clientX: 10, clientY: 50 }],
        cancelable: true,
      })
    ).toBe(true);
    act(() => jest.advanceTimersByTime(DEFAULT_LONG_PRESS_DURATION_MS));
    fireEvent.touchEnd(mainButton);
    fireEvent.click(mainButton, { detail: 1 });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onDropClick).not.toHaveBeenCalled();
  });

  it("opens voting modal when vote button clicked", async () => {
    const onDropClick = jest.fn();
    render(
      <WaveLeaderboardGalleryItem drop={drop} onDropClick={onDropClick} />
    );
    expect(screen.getByTestId("modal")).toHaveAttribute("data-open", "false");
    await userEvent.click(screen.getByTestId("vote-btn"));
    expect(screen.getByTestId("modal")).toHaveAttribute("data-open", "true");
    expect(onDropClick).not.toHaveBeenCalled();
  });

  it("renders the title as natural wrapping text without truncation", () => {
    const title =
      "When The World is Destroyed Again Because The Drop Title Keeps Going";

    render(
      <WaveLeaderboardGalleryItem
        drop={{ ...drop, title }}
        onDropClick={jest.fn()}
      />
    );

    const titleElement = screen.getByRole("heading", { name: title });

    expect(titleElement).toHaveClass(
      "tw-whitespace-normal",
      "tw-[overflow-wrap:anywhere]",
      "tw-break-words"
    );
    expect(titleElement).not.toHaveClass("tw-line-clamp-2");
    expect(titleElement).not.toHaveClass("tw-min-h-[2.25rem]");
    expect(titleElement).not.toHaveClass("tw-truncate");
    expect(titleElement).toHaveTextContent(title);
  });

  it("keeps additional action out of the title row and preserves footer order", () => {
    const title = "Additional Action Drop Title";

    render(
      <WaveLeaderboardGalleryItem
        drop={{
          ...drop,
          title,
          is_additional_action_promised: true,
        }}
        onDropClick={jest.fn()}
      />
    );

    const titleElement = screen.getByRole("heading", { name: title });
    const trigger = screen.getByRole("button", {
      name: "View voters and vote log for 3 voters",
    });
    const voteButton = screen.getByTestId("vote-btn");

    expect(screen.getByText("Additional Action")).toBeInTheDocument();
    expect(titleElement).toHaveClass("tw-whitespace-normal");
    expect(titleElement).not.toHaveClass("tw-line-clamp-2");
    expect(titleElement).not.toHaveClass("tw-truncate");
    expect(
      trigger.compareDocumentPosition(voteButton) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("renders matching-height gallery actions in the footer", () => {
    render(<WaveLeaderboardGalleryItem drop={drop} onDropClick={jest.fn()} />);

    const trigger = screen.getByRole("button", {
      name: "View voters and vote log for 3 voters",
    });
    const voteButton = screen.getByTestId("vote-btn");

    expect(trigger).toHaveTextContent(/3\s*voters/);
    expect(trigger).toHaveClass(
      "tw-border-white/[0.06]",
      "tw-bg-white/[0.05]",
      "tw-box-border",
      "tw-h-8",
      "tw-px-2.5",
      "tw-py-0"
    );
    expect(trigger.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(voteButton).toHaveClass("tw-box-border");
    expect(voteButton).not.toHaveClass("tw-h-8");
    expect(voteButton).toHaveTextContent("You: 1 NIC");
    expect(
      trigger.compareDocumentPosition(voteButton) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("keeps the vote button label when the user has not voted", () => {
    render(
      <WaveLeaderboardGalleryItem
        drop={{
          ...drop,
          context_profile_context: { rating: 0 },
        }}
        onDropClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("vote-btn")).toHaveTextContent("Vote");
    expect(screen.queryByText(/Your votes:/)).not.toBeInTheDocument();
  });

  it("does not open the drop when the vote-details chip is clicked", async () => {
    const onDropClick = jest.fn();

    render(
      <WaveLeaderboardGalleryItem drop={drop} onDropClick={onDropClick} />
    );

    await userEvent.click(
      screen.getByRole("button", {
        name: "View voters and vote log for 3 voters",
      })
    );

    expect(onDropClick).not.toHaveBeenCalled();
  });

  it("closes voting modal when voting closes", async () => {
    const { rerender } = render(
      <WaveLeaderboardGalleryItem drop={drop} onDropClick={jest.fn()} />
    );

    await userEvent.click(screen.getByTestId("vote-btn"));
    expect(screen.getByTestId("modal")).toHaveAttribute("data-open", "true");

    rerender(
      <WaveLeaderboardGalleryItem
        drop={drop}
        onDropClick={jest.fn()}
        isVotingClosed={true}
      />
    );

    expect(screen.getByTestId("modal")).toHaveAttribute("data-open", "false");
    expect(screen.queryByTestId("vote-btn")).toBeNull();
  });

  it("hides vote action while controls are locked without passing closed state to votes", () => {
    render(
      <WaveLeaderboardGalleryItem
        drop={drop}
        onDropClick={jest.fn()}
        winningThreshold={10}
        isVotingClosed={false}
        isVotingControlsLocked={true}
      />
    );

    expect(screen.queryByTestId("vote-btn")).toBeNull();
    expect(screen.getByTestId("votes")).toHaveAttribute(
      "data-winning-threshold",
      "10"
    );
    expect(screen.getByTestId("votes")).toHaveAttribute(
      "data-is-voting-closed",
      "false"
    );
  });

  it("closes voting modal when controls become locked", async () => {
    const { rerender } = render(
      <WaveLeaderboardGalleryItem drop={drop} onDropClick={jest.fn()} />
    );

    await userEvent.click(screen.getByTestId("vote-btn"));
    expect(screen.getByTestId("modal")).toHaveAttribute("data-open", "true");

    rerender(
      <WaveLeaderboardGalleryItem
        drop={drop}
        onDropClick={jest.fn()}
        isVotingControlsLocked={true}
      />
    );

    expect(screen.getByTestId("modal")).toHaveAttribute("data-open", "false");
    expect(screen.queryByTestId("vote-btn")).toBeNull();
  });

  it("hides voting button when voting is closed", () => {
    render(
      <WaveLeaderboardGalleryItem
        drop={drop}
        onDropClick={jest.fn()}
        isVotingClosed={true}
      />
    );

    expect(screen.queryByTestId("vote-btn")).toBeNull();
  });

  it("passes approve status props to the vote display", () => {
    render(
      <WaveLeaderboardGalleryItem
        drop={drop}
        onDropClick={jest.fn()}
        winningThreshold={10}
        winningThresholdMinDurationMs={120_000}
        isVotingClosed={true}
      />
    );

    expect(screen.getByTestId("votes")).toHaveAttribute(
      "data-winning-threshold",
      "10"
    );
    expect(screen.getByTestId("votes")).toHaveAttribute(
      "data-winning-threshold-min-duration",
      "120000"
    );
    expect(screen.getByTestId("votes")).toHaveAttribute(
      "data-is-voting-closed",
      "true"
    );
  });

  it("applies artFocused styles", () => {
    const { container } = render(
      <WaveLeaderboardGalleryItem
        drop={drop}
        onDropClick={jest.fn()}
        artFocused={false}
      />
    );
    expect(container.firstChild).not.toHaveClass("active:tw-bg-iron-900");
  });

  it("renders a condensed identity summary for identity waves", () => {
    render(
      <WaveLeaderboardGalleryItem
        drop={{
          ...drop,
          wave: {
            ...drop.wave,
            submission_type:
              ApiWaveParticipationSubmissionStrategyType.Identity,
          },
        }}
        onDropClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("identity")).toHaveAttribute(
      "data-variant",
      "condensed"
    );
  });

  it("uses preview images for video media when metadata provides one", () => {
    render(
      <WaveLeaderboardGalleryItem
        drop={{
          ...drop,
          metadata: [
            {
              data_key: "additional_media",
              data_value: JSON.stringify({
                preview_image: "https://example.com/preview.jpg",
              }),
            },
          ],
          parts: [{ media: [{ url: "video.mp4", mime_type: "video/mp4" }] }],
        }}
        onDropClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("media")).toHaveAttribute(
      "data-preview-image-url",
      "https://example.com/preview.jpg"
    );
  });

  it("keeps video controls outside the keyboard-operable drop trigger", async () => {
    const onDropClick = jest.fn();
    render(
      <WaveLeaderboardGalleryItem
        drop={{
          ...drop,
          parts: [{ media: [{ url: "video.mp4", mime_type: "video/mp4" }] }],
        }}
        onDropClick={onDropClick}
      />
    );

    expect(screen.getByTestId("media").closest("button")).toBeNull();
    const openDropButton = screen.getByRole("button", {
      name: "Open drop media",
    });
    openDropButton.focus();
    await userEvent.keyboard("{Enter}");
    expect(onDropClick).toHaveBeenCalledTimes(1);
  });
});
