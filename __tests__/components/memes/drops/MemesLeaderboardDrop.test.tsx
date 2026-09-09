import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemesLeaderboardDrop } from "@/components/memes/drops/MemesLeaderboardDrop";
import type MemesLeaderboardDropVoteSummary from "@/components/memes/drops/MemesLeaderboardDropVoteSummary";

const useIsMobileScreen = jest.fn();
jest.mock("@/hooks/isMobileScreen", () => ({
  __esModule: true,
  default: (...args: any[]) => useIsMobileScreen(...args),
}));

const useDropInteractionRules = jest.fn();
jest.mock("@/hooks/drops/useDropInteractionRules", () => ({
  useDropInteractionRules: (...args: any[]) => useDropInteractionRules(...args),
}));

const useDeviceInfo = jest.fn();
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: (...args: any[]) => useDeviceInfo(...args),
}));

const useLongPressInteraction = jest.fn();
jest.mock("@/hooks/useLongPressInteraction", () => ({
  __esModule: true,
  default: (...args: any[]) => useLongPressInteraction(...args),
}));
jest.mock("@/utils/monitoring/dropOpenTiming", () => ({
  startDropOpen: jest.fn(),
}));

const mockVoteSummary = jest.fn(
  (props: React.ComponentProps<typeof MemesLeaderboardDropVoteSummary>) => {
    const Summary = jest.requireActual<
      typeof import("@/components/memes/drops/MemesLeaderboardDropVoteSummary")
    >("@/components/memes/drops/MemesLeaderboardDropVoteSummary").default;
    return <Summary {...props} />;
  }
);
const mockVoteDetailsTrigger = jest.fn((props: any) => (
  <button
    type="button"
    data-testid="vote-details"
    onClick={(event) => event.stopPropagation()}
  >
    View voters and vote log for {props.drop.raters_count}{" "}
    {props.drop.raters_count === 1 ? "voter" : "voters"}
  </button>
));

jest.mock(
  "@/components/waves/drops/participation/ratings/ParticipationDropVoteDetailsTrigger",
  () => ({
    __esModule: true,
    default: (props: any) => mockVoteDetailsTrigger(props),
  })
);
jest.mock(
  "@/components/memes/drops/MemesLeaderboardDropCard",
  () => (props: any) => (
    <div data-testid="card" {...props}>
      {props.children}
    </div>
  )
);
jest.mock(
  "@/components/memes/drops/MemesLeaderboardDropHeader",
  () => (p: any) => <div data-testid="header">{p.title}</div>
);
jest.mock(
  "@/components/memes/drops/MemesLeaderboardDropDescription",
  () => (p: any) => <div data-testid="desc">{p.description}</div>
);
jest.mock(
  "@/components/memes/drops/MemesLeaderboardDropVoteSummary",
  () => (props: any) => mockVoteSummary(props)
);
jest.mock(
  "@/components/memes/drops/MemesLeaderboardDropArtistInfo",
  () => () => (
    <a
      href="/alice"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      alice
    </a>
  )
);
jest.mock("@/components/memes/drops/MemeDropTraits", () => () => (
  <div data-testid="traits" data-tooltip-id="trait-tooltip" />
));
jest.mock(
  "@/components/drops/view/item/content/media/DropListItemContentMedia",
  () => () => (
    <div data-testid="media">
      <button
        type="button"
        data-testid="media-preview"
        onClick={(event) => event.stopPropagation()}
      >
        Open media preview
      </button>
    </div>
  )
);
jest.mock(
  "@/components/drops/view/item/content/media/MediaDisplay",
  () =>
    (props: {
      readonly isInertPreview?: boolean;
      readonly disableMediaInteraction?: boolean;
    }) => (
      <div
        data-testid="media"
        data-inert-preview={String(props.isInertPreview)}
        data-disable-media-interaction={String(props.disableMediaInteraction)}
      />
    )
);
jest.mock("@/components/waves/drops/WaveDropActionsOpen", () => () => (
  <button
    type="button"
    data-testid="desktop-open-action"
    onClick={(event) => event.stopPropagation()}
  />
));
jest.mock("@/components/waves/drops/WaveDropActionsOptions", () => () => (
  <button
    type="button"
    data-testid="desktop-delete-action"
    onClick={(event) => event.stopPropagation()}
  />
));
jest.mock("@/components/content-moderation/ContentModerationDropActions", () =>
  jest.fn(() => null)
);
jest.mock("@/components/content-moderation/ReportDropModal", () =>
  jest.fn(() => null)
);
jest.mock("@/components/voting", () => ({
  VotingModal: (p: any) => (
    <div data-testid="modal">{p.isOpen ? "open" : "closed"}</div>
  ),
  MobileVotingModal: (p: any) => (
    <div data-testid="mobile-modal">{p.isOpen ? "open" : "closed"}</div>
  ),
}));
jest.mock("@/components/voting/VotingModalButton", () => (p: any) => (
  <button
    data-testid="vote-btn"
    onClick={(event) => {
      event.stopPropagation();
      p.onClick();
    }}
  >
    vote
  </button>
));
jest.mock(
  "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper",
  () => (p: any) => (
    <div data-testid="wrapper">
      <button data-testid="dismiss-menu" onClick={() => p.setOpen(false)}>
        dismiss menu
      </button>
      <button data-testid="after-leave" onClick={p.onAfterLeave}>
        after leave
      </button>
      {p.children}
    </div>
  )
);
jest.mock("@/components/waves/drops/WaveDropMobileMenuDelete", () => () => (
  <div data-testid="mobile-delete" />
));
jest.mock("@/components/waves/drops/WaveDropMobileMenuOpen", () => (p: any) => (
  <button
    type="button"
    data-testid="mobile-open"
    onClick={() => p.onOpenChange(false)}
  />
));
jest.mock(
  "@/components/waves/drops/WaveDropMobileMenuCopyLink",
  () => (p: any) => (
    <button type="button" data-testid="mobile-copy" onClick={p.onCopy} />
  )
);
jest.mock("@/components/waves/memes/submission/MemesArtResubmitAction", () => ({
  MemesArtResubmitAction: (p: any) => (
    <button data-testid="resubmit-action" onClick={p.onOpenModal}>
      resubmit
    </button>
  ),
}));

const mockMemesArtSubmissionModal = jest.fn((p: any) =>
  p.isOpen ? (
    <button data-testid="resubmit-modal" onClick={p.onSourceDropDeleted}>
      source deleted
    </button>
  ) : null
);

jest.mock("@/components/waves/memes/MemesArtSubmissionModal", () => ({
  __esModule: true,
  default: (p: any) => mockMemesArtSubmissionModal(p),
}));

const { startDropOpen } = require("@/utils/monitoring/dropOpenTiming") as {
  startDropOpen: jest.Mock;
};

const drop: any = {
  id: "d1",
  wave: { id: "w1", voting_credit_type: "CREDIT" },
  parts: [{ media: [{ mime_type: "image", url: "img" }] }],
  metadata: [
    { data_key: "title", data_value: "T" },
    { data_key: "description", data_value: "D" },
  ],
  rating: 1,
  rating_prediction: 2,
  raters_count: 0,
  top_raters: [],
  context_profile_context: "ctx",
};

beforeEach(() => {
  jest.clearAllMocks();
  useDeviceInfo.mockReturnValue({ hasTouchScreen: false, isApp: false });
  useDropInteractionRules.mockReturnValue({ canDelete: true });
  useLongPressInteraction.mockReturnValue({
    isActive: false,
    setIsActive: jest.fn(),
    touchHandlers: {},
  });
});

test("calls onDropClick when not touch screen", async () => {
  useDeviceInfo.mockReturnValue({ hasTouchScreen: false });
  useIsMobileScreen.mockReturnValue(false);
  const onClick = jest.fn();
  render(<MemesLeaderboardDrop drop={drop} onDropClick={onClick} />);
  await userEvent.click(screen.getByRole("button", { name: "Open T" }));
  expect(onClick).toHaveBeenCalledTimes(1);
  expect(onClick).toHaveBeenCalledWith(drop);
  expect(startDropOpen).toHaveBeenCalledTimes(1);
});

test.each(["header", "traits", "media"])(
  "opens the desktop drop exactly once from passive %s content",
  async (testId) => {
    useIsMobileScreen.mockReturnValue(false);
    const onDropClick = jest.fn();
    render(<MemesLeaderboardDrop drop={drop} onDropClick={onDropClick} />);

    await userEvent.click(screen.getByTestId(testId));

    expect(onDropClick).toHaveBeenCalledTimes(1);
    expect(onDropClick).toHaveBeenCalledWith(drop);
    expect(startDropOpen).toHaveBeenCalledTimes(1);
  }
);

test.each([
  { environment: "native touch app", isApp: true },
  { environment: "touch browser", isApp: false },
])(
  "does not open via passive-content bubbling in the $environment",
  ({ isApp }) => {
    useDeviceInfo.mockReturnValue({ hasTouchScreen: true, isApp });
    useIsMobileScreen.mockReturnValue(true);
    const onDropClick = jest.fn();
    render(<MemesLeaderboardDrop drop={drop} onDropClick={onDropClick} />);

    // Native hit testing opens through the sibling primary button, not bubbling.
    fireEvent.click(screen.getByTestId("header"));
    fireEvent.click(screen.getByTestId("traits"));
    fireEvent.click(screen.getByTestId("media"));

    expect(onDropClick).not.toHaveBeenCalled();
    expect(startDropOpen).not.toHaveBeenCalled();
  }
);

test("opens the drop with Enter and Space on its named primary button", async () => {
  const user = userEvent.setup();
  const onDropClick = jest.fn();
  useDeviceInfo.mockReturnValue({ hasTouchScreen: false });
  useIsMobileScreen.mockReturnValue(false);

  render(<MemesLeaderboardDrop drop={drop} onDropClick={onDropClick} />);
  const openButton = screen.getByRole("button", { name: "Open T" });

  openButton.focus();
  await user.keyboard("{Enter}");
  await user.keyboard(" ");

  expect(onDropClick).toHaveBeenCalledTimes(2);
  expect(onDropClick).toHaveBeenLastCalledWith(drop);
  expect(openButton.querySelector("a, button")).toBeNull();
});

test.each([
  { environment: "touch browser", hasTouchScreen: true, isApp: false },
  { environment: "desktop browser", hasTouchScreen: false, isApp: false },
  { environment: "app without touch", hasTouchScreen: false, isApp: true },
])(
  "keeps author and media interactions independent in $environment",
  async ({ hasTouchScreen, isApp }) => {
    const onDropClick = jest.fn();
    useDeviceInfo.mockReturnValue({ hasTouchScreen, isApp });
    useIsMobileScreen.mockReturnValue(hasTouchScreen);

    render(<MemesLeaderboardDrop drop={drop} onDropClick={onDropClick} />);
    const authorLink = screen.getByRole("link", { name: "alice" });

    expect(authorLink.closest("button")).toBeNull();
    expect(screen.getByTestId("media").closest("[inert]")).toBeNull();
    await userEvent.click(authorLink);
    await userEvent.click(screen.getByTestId("media-preview"));

    expect(onDropClick).not.toHaveBeenCalled();
  }
);

test("keeps the native List username independent from submission opening", async () => {
  useDeviceInfo.mockReturnValue({ hasTouchScreen: true, isApp: true });
  useIsMobileScreen.mockReturnValue(true);
  const onDropClick = jest.fn();
  render(<MemesLeaderboardDrop drop={drop} onDropClick={onDropClick} />);

  const authorLink = screen.getByRole("link", { name: "alice" });
  expect(authorLink).toHaveAttribute("href", "/alice");
  await userEvent.click(authorLink);
  expect(onDropClick).not.toHaveBeenCalled();
  expect(screen.getByTestId("media").closest("[inert]")).not.toBeNull();
  expect(screen.getByTestId("media")).toHaveAttribute(
    "data-inert-preview",
    "true"
  );
  expect(screen.getByTestId("media")).toHaveAttribute(
    "data-disable-media-interaction",
    "true"
  );
  const primaryButton = screen.getByRole("button", { name: "Open T" });
  expect(primaryButton.querySelector("a, button")).toBeNull();

  // Physical-device coverage verifies preview hits reach this sibling button.
  await userEvent.click(primaryButton);

  expect(onDropClick).toHaveBeenCalledWith(drop);
  await userEvent.click(screen.getByTestId("vote-btn"));
  await userEvent.click(screen.getByTestId("vote-details"));
  expect(onDropClick).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId("mobile-modal")).toHaveTextContent("open");
});

test("does not add a full-card open target to the touch browser", () => {
  useDeviceInfo.mockReturnValue({ hasTouchScreen: true, isApp: false });
  useIsMobileScreen.mockReturnValue(true);
  render(<MemesLeaderboardDrop drop={drop} onDropClick={jest.fn()} />);

  expect(
    screen.queryByRole("button", { name: "Open T" })
  ).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "alice" })).toBeInTheDocument();
  expect(screen.getByTestId("media").closest("[inert]")).toBeNull();
});

test("passes the drop to vote summary and opens vote details without opening the card", async () => {
  useDeviceInfo.mockReturnValue({ hasTouchScreen: false });
  useIsMobileScreen.mockReturnValue(false);
  const onClick = jest.fn();

  render(<MemesLeaderboardDrop drop={drop} onDropClick={onClick} />);

  expect(mockVoteSummary).toHaveBeenCalledWith(
    expect.objectContaining({ drop })
  );

  await userEvent.click(screen.getByTestId("vote-details"));

  expect(onClick).not.toHaveBeenCalled();
  expect(mockVoteDetailsTrigger).toHaveBeenCalledWith(
    expect.objectContaining({ drop, visualVariant: "memes" })
  );
});

test("opens the drop through its named primary button in the native touch app", async () => {
  useDeviceInfo.mockReturnValue({ hasTouchScreen: true, isApp: true });
  useIsMobileScreen.mockReturnValue(true);
  const onClick = jest.fn();
  render(<MemesLeaderboardDrop drop={drop} onDropClick={onClick} />);

  // Native-device coverage verifies that title/background hit testing reaches this button.
  await userEvent.click(screen.getByRole("button", { name: "Open T" }));

  expect(startDropOpen).toHaveBeenCalledWith({
    dropId: "d1",
    waveId: "w1",
    source: "leaderboard_memes",
    isMobile: true,
  });
  expect(onClick).toHaveBeenCalledWith(drop);
});

test("keeps native touch scrolling enabled for long-press detection", () => {
  useDeviceInfo.mockReturnValue({ hasTouchScreen: true });
  useIsMobileScreen.mockReturnValue(true);

  render(<MemesLeaderboardDrop drop={drop} onDropClick={jest.fn()} />);

  expect(useLongPressInteraction).toHaveBeenCalledWith(
    expect.objectContaining({
      hasTouchScreen: true,
      onInteractionStart: expect.any(Function),
      preventDefault: false,
    })
  );
});

test("rejects a scrolling release click without blocking the next intentional card tap", () => {
  useDeviceInfo.mockReturnValue({ hasTouchScreen: true, isApp: true });
  useIsMobileScreen.mockReturnValue(true);
  const onDropClick = jest.fn();
  render(<MemesLeaderboardDrop drop={drop} onDropClick={onDropClick} />);
  const openButton = screen.getByRole("button", { name: "Open T" });
  const touch = { identifier: 1, clientX: 10, clientY: 100 };

  fireEvent.touchStart(openButton, { touches: [touch] });
  fireEvent.touchMove(openButton, {
    touches: [{ ...touch, clientY: 50 }],
  });
  fireEvent.touchEnd(openButton);
  fireEvent.click(openButton, { detail: 1 });
  expect(onDropClick).not.toHaveBeenCalled();

  fireEvent.touchStart(openButton, { touches: [touch] });
  fireEvent.touchEnd(openButton);
  fireEvent.click(openButton, { detail: 1 });
  expect(onDropClick).toHaveBeenCalledTimes(1);
});

test("keeps artwork taps in the media surface", async () => {
  useDeviceInfo.mockReturnValue({ hasTouchScreen: true });
  useIsMobileScreen.mockReturnValue(true);
  const onDropClick = jest.fn();

  render(<MemesLeaderboardDrop drop={drop} onDropClick={onDropClick} />);

  await userEvent.click(screen.getByTestId("media-preview"));

  expect(startDropOpen).not.toHaveBeenCalled();
  expect(onDropClick).not.toHaveBeenCalled();
});

test("suppresses the click generated after a long press", async () => {
  useDeviceInfo.mockReturnValue({ hasTouchScreen: true, isApp: true });
  useIsMobileScreen.mockReturnValue(true);
  const onDropClick = jest.fn();
  render(<MemesLeaderboardDrop drop={drop} onDropClick={onDropClick} />);
  const longPressOptions = useLongPressInteraction.mock.calls[0][0];
  const openButton = screen.getByRole("button", { name: "Open T" });

  longPressOptions.onInteractionStart();
  fireEvent.touchEnd(openButton);
  await userEvent.click(openButton);

  expect(startDropOpen).not.toHaveBeenCalled();
  expect(onDropClick).not.toHaveBeenCalled();

  fireEvent.touchStart(openButton, {
    touches: [{ identifier: 1, clientX: 10, clientY: 10 }],
  });
  fireEvent.touchEnd(openButton);
  await userEvent.click(openButton);

  expect(startDropOpen).toHaveBeenCalledTimes(1);
  expect(onDropClick).toHaveBeenCalledTimes(1);
});

test("allows a fresh card tap after dismissing a long-press menu without a release click", () => {
  const setIsActive = jest.fn();
  const onDropClick = jest.fn();
  useDeviceInfo.mockReturnValue({ hasTouchScreen: true, isApp: true });
  useIsMobileScreen.mockReturnValue(true);
  useLongPressInteraction.mockReturnValueOnce({
    isActive: true,
    setIsActive,
    touchHandlers: {},
  });

  render(<MemesLeaderboardDrop drop={drop} onDropClick={onDropClick} />);
  const openButton = screen.getByRole("button", { name: "Open T" });
  useLongPressInteraction.mock.calls[0][0].onInteractionStart();
  fireEvent.touchEnd(openButton);
  fireEvent.click(screen.getByTestId("dismiss-menu"));

  expect(setIsActive).toHaveBeenCalledWith(false);
  expect(onDropClick).not.toHaveBeenCalled();

  fireEvent.touchStart(openButton, {
    touches: [{ identifier: 1, clientX: 10, clientY: 10 }],
  });
  fireEvent.touchEnd(openButton);
  fireEvent.click(openButton);

  expect(onDropClick).toHaveBeenCalledTimes(1);
});

test("allows the first real mobile-menu tap after a long press", () => {
  const setIsActive = jest.fn();
  useDeviceInfo.mockReturnValue({ hasTouchScreen: true });
  useIsMobileScreen.mockReturnValue(true);
  useLongPressInteraction.mockReturnValueOnce({
    isActive: true,
    setIsActive,
    touchHandlers: {},
  });
  const onDropClick = jest.fn();

  render(<MemesLeaderboardDrop drop={drop} onDropClick={onDropClick} />);
  const longPressOptions = useLongPressInteraction.mock.calls[0][0];

  longPressOptions.onInteractionStart();
  fireEvent.click(screen.getByTestId("mobile-open"));

  expect(setIsActive).toHaveBeenCalledWith(false);
  expect(startDropOpen).not.toHaveBeenCalled();
  expect(onDropClick).not.toHaveBeenCalled();
});

test("opens voting modal on desktop", async () => {
  useDeviceInfo.mockReturnValue({ hasTouchScreen: false });
  useIsMobileScreen.mockReturnValue(false);
  render(<MemesLeaderboardDrop drop={drop} onDropClick={jest.fn()} />);
  expect(screen.getByTestId("modal")).toHaveTextContent("closed");
  await userEvent.click(screen.getByTestId("vote-btn"));
  expect(screen.getByTestId("modal")).toHaveTextContent("open");
});

test("shows direct open and delete actions on desktop", () => {
  useDeviceInfo.mockReturnValue({ hasTouchScreen: false });
  useIsMobileScreen.mockReturnValue(false);

  render(<MemesLeaderboardDrop drop={drop} onDropClick={jest.fn()} />);

  expect(screen.getByTestId("desktop-open-action")).toBeInTheDocument();
  expect(screen.getByTestId("desktop-delete-action")).toBeInTheDocument();
  expect(screen.queryByTestId("more-actions")).not.toBeInTheDocument();
});

test("keeps direct desktop actions from triggering the leaderboard card", async () => {
  const user = userEvent.setup();
  const onDropClick = jest.fn();
  useDeviceInfo.mockReturnValue({ hasTouchScreen: false });
  useIsMobileScreen.mockReturnValue(false);

  render(<MemesLeaderboardDrop drop={drop} onDropClick={onDropClick} />);

  await user.click(screen.getByTestId("desktop-open-action"));
  await user.click(screen.getByTestId("desktop-delete-action"));

  expect(onDropClick).not.toHaveBeenCalled();
});

test("keeps open and hides delete when desktop deletion is unavailable", () => {
  useDropInteractionRules.mockReturnValue({ canDelete: false });
  useDeviceInfo.mockReturnValue({ hasTouchScreen: false });
  useIsMobileScreen.mockReturnValue(false);

  render(<MemesLeaderboardDrop drop={drop} onDropClick={jest.fn()} />);

  expect(screen.getByTestId("desktop-open-action")).toBeInTheDocument();
  expect(screen.queryByTestId("desktop-delete-action")).not.toBeInTheDocument();
});

test("uses mobile modal on small screens", async () => {
  useDeviceInfo.mockReturnValue({ hasTouchScreen: false });
  useIsMobileScreen.mockReturnValue(true);
  render(<MemesLeaderboardDrop drop={drop} onDropClick={jest.fn()} />);
  await userEvent.click(screen.getByTestId("vote-btn"));
  expect(screen.getByTestId("mobile-modal")).toHaveTextContent("open");
});

test("uses v2 part one title and content before metadata fallbacks", () => {
  useDeviceInfo.mockReturnValue({ hasTouchScreen: false });
  useIsMobileScreen.mockReturnValue(false);

  render(
    <MemesLeaderboardDrop
      drop={{
        ...drop,
        title: "Part title",
        parts: [
          {
            content: "Part description",
            media: [{ mime_type: "image", url: "img" }],
          },
        ],
      }}
      onDropClick={jest.fn()}
    />
  );

  expect(screen.getByTestId("header")).toHaveTextContent("Part title");
  expect(screen.getByTestId("desc")).toHaveTextContent("Part description");
});

test("shows additional action badge only when promised", () => {
  useDeviceInfo.mockReturnValue({ hasTouchScreen: false });
  useIsMobileScreen.mockReturnValue(false);

  const { rerender } = render(
    <MemesLeaderboardDrop drop={drop} onDropClick={jest.fn()} />
  );

  expect(screen.queryByText("Additional Action")).not.toBeInTheDocument();

  rerender(
    <MemesLeaderboardDrop
      drop={{ ...drop, is_additional_action_promised: true }}
      onDropClick={jest.fn()}
    />
  );

  expect(screen.getByText("Additional Action")).toBeInTheDocument();
});

test("opens mobile resubmit modal after the touch menu leaves", async () => {
  const setIsActive = jest.fn();
  useDeviceInfo.mockReturnValue({ hasTouchScreen: true });
  useIsMobileScreen.mockReturnValue(false);
  useLongPressInteraction.mockReturnValueOnce({
    isActive: true,
    setIsActive,
    touchHandlers: {},
  });

  render(
    <MemesLeaderboardDrop
      drop={drop}
      wave={{ id: "w1" } as any}
      onDropClick={jest.fn()}
    />
  );

  await userEvent.click(screen.getByTestId("resubmit-action"));

  expect(setIsActive).toHaveBeenCalledWith(false);
  expect(mockMemesArtSubmissionModal).not.toHaveBeenCalled();
  expect(screen.queryByTestId("resubmit-modal")).not.toBeInTheDocument();

  await userEvent.click(screen.getByTestId("after-leave"));

  expect(mockMemesArtSubmissionModal).toHaveBeenCalledWith(
    expect.objectContaining({ isOpen: true })
  );
  expect(screen.getByTestId("resubmit-modal")).toBeInTheDocument();
});

test("shows copy link in the touch action sheet", () => {
  useDeviceInfo.mockReturnValue({ hasTouchScreen: true });
  useIsMobileScreen.mockReturnValue(false);
  useLongPressInteraction.mockReturnValueOnce({
    isActive: true,
    setIsActive: jest.fn(),
    touchHandlers: {},
  });

  render(
    <MemesLeaderboardDrop
      drop={drop}
      wave={{ id: "w1" } as any}
      onDropClick={jest.fn()}
    />
  );

  expect(screen.getByTestId("mobile-copy")).toBeInTheDocument();
});

test("notifies when mobile resubmit deletes the source drop", async () => {
  const setIsActive = jest.fn();
  const onSourceDropDeleted = jest.fn();
  useDeviceInfo.mockReturnValue({ hasTouchScreen: true });
  useIsMobileScreen.mockReturnValue(false);
  useLongPressInteraction.mockReturnValueOnce({
    isActive: true,
    setIsActive,
    touchHandlers: {},
  });

  render(
    <MemesLeaderboardDrop
      drop={drop}
      wave={{ id: "w1" } as any}
      onDropClick={jest.fn()}
      onSourceDropDeleted={onSourceDropDeleted}
    />
  );

  await userEvent.click(screen.getByTestId("resubmit-action"));
  await userEvent.click(screen.getByTestId("after-leave"));
  await userEvent.click(screen.getByTestId("resubmit-modal"));

  expect(onSourceDropDeleted).toHaveBeenCalledTimes(1);
});
