import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemesLeaderboardDrop } from "@/components/memes/drops/MemesLeaderboardDrop";

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

const mockVoteSummary = jest.fn(() => <div data-testid="summary" />);
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
  () => () => <div data-testid="artist" />
);
jest.mock("@/components/memes/drops/MemeDropTraits", () => () => (
  <div data-testid="traits" />
));
jest.mock(
  "@/components/drops/view/item/content/media/DropListItemContentMedia",
  () => () => <div data-testid="media" />
);
jest.mock("@/components/waves/drops/WaveDropActionsOptions", () => () => (
  <div data-testid="options" />
));
jest.mock("@/components/waves/drops/WaveDropActionsOpen", () => () => (
  <div data-testid="open" />
));
jest.mock("@/components/voting", () => ({
  VotingModal: (p: any) => (
    <div data-testid="modal">{p.isOpen ? "open" : "closed"}</div>
  ),
  MobileVotingModal: (p: any) => (
    <div data-testid="mobile-modal">{p.isOpen ? "open" : "closed"}</div>
  ),
}));
jest.mock("@/components/voting/VotingModalButton", () => (p: any) => (
  <button data-testid="vote-btn" onClick={p.onClick}>
    vote
  </button>
));
jest.mock(
  "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper",
  () => (p: any) => (
    <div data-testid="wrapper">
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
jest.mock("@/components/waves/drops/WaveDropMobileMenuOpen", () => () => (
  <div data-testid="mobile-open" />
));
jest.mock("@/components/waves/drops/WaveDropMobileMenuCopyLink", () => () => (
  <div data-testid="mobile-copy" />
));
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
jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (node: any) => node,
}));

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
  mockVoteSummary.mockClear();
  mockVoteDetailsTrigger.mockClear();
  mockMemesArtSubmissionModal.mockClear();
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
  const { container } = render(
    <MemesLeaderboardDrop drop={drop} onDropClick={onClick} />
  );
  await userEvent.click(container.firstElementChild as HTMLElement);
  expect(onClick).toHaveBeenCalledWith(drop);
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
    expect.objectContaining({ drop, density: "compact" })
  );
});

test("does not call onDropClick on touch devices", async () => {
  useDeviceInfo.mockReturnValue({ hasTouchScreen: true });
  useIsMobileScreen.mockReturnValue(false);
  const onClick = jest.fn();
  const { container } = render(
    <MemesLeaderboardDrop drop={drop} onDropClick={onClick} />
  );
  await userEvent.click(container.firstElementChild as HTMLElement);
  expect(onClick).not.toHaveBeenCalled();
});

test("opens voting modal on desktop", async () => {
  useDeviceInfo.mockReturnValue({ hasTouchScreen: false });
  useIsMobileScreen.mockReturnValue(false);
  render(<MemesLeaderboardDrop drop={drop} onDropClick={jest.fn()} />);
  expect(screen.getByTestId("modal")).toHaveTextContent("closed");
  await userEvent.click(screen.getByTestId("vote-btn"));
  expect(screen.getByTestId("modal")).toHaveTextContent("open");
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
