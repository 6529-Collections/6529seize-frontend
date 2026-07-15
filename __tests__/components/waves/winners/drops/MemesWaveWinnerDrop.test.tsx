import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemesWaveWinnersDrop } from "@/components/waves/winners/drops/MemesWaveWinnerDrop";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveDecisionWinner } from "@/generated/models/ApiWaveDecisionWinner";

const mockMobileMenuOpenClick = jest.fn();

jest.mock("@/helpers/waves/drop.helpers", () => ({
  convertApiDropToExtendedDrop: jest.fn(() => ({ id: "ext" })),
}));
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));
jest.mock(
  "@/components/waves/winners/drops/header/WaveWinnersDropHeaderAuthorPfp",
  () => () => <div data-testid="pfp" />
);
jest.mock("@/components/user/utils/UserCICAndLevel", () => ({
  __esModule: true,
  default: () => <div data-testid="level" />,
  UserCICAndLevelSize: {},
}));
jest.mock("@/helpers/Helpers", () => ({
  cicToType: jest.fn(),
  formatNumberWithCommas: (n: number) => String(n),
}));
jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: () => <svg data-testid="icon" />,
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, onClick, className }: any) => (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  ),
}));
jest.mock("@/components/memes/drops/MemeDropTraits", () => () => (
  <div data-testid="traits" />
));
jest.mock(
  "@/components/drops/view/item/content/media/DropListItemContentMedia",
  () => () => <div data-testid="media" />
);
jest.mock("@/components/waves/drops/DropAuthorBadges", () => ({
  DropAuthorBadges: () => <div data-testid="author-badges" />,
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/hooks/useLongPressInteraction", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/components/waves/drops/WaveDropActionsOpen", () => () => (
  <div data-testid="actions" />
));
jest.mock(
  "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper",
  () => (p: any) =>
    p.isOpen ? <div data-testid="mobile-wrapper">{p.children}</div> : null
);
jest.mock("@/components/waves/drops/WaveDropMobileMenuOpen", () => ({
  __esModule: true,
  default: (props: { onOpenChange: () => void }) => (
    <button
      type="button"
      data-testid="mobile"
      onClick={() => {
        mockMobileMenuOpenClick();
        props.onOpenChange();
      }}
    >
      Open drop
    </button>
  ),
}));
jest.mock("@/components/waves/drops/WaveDropMobileMenuCopyLink", () => ({
  __esModule: true,
  default: () => <button type="button" data-testid="mobile-copy" />,
}));
jest.mock("@/components/waves/drops/time/WaveDropTime", () => () => (
  <span data-testid="time" />
));
jest.mock("@/components/waves/winners/identity/WaveWinnerIdentity", () => ({
  WaveWinnerIdentity: () => <div data-testid="identity" />,
}));
jest.mock("@/hooks/isMobileScreen", () => ({
  __esModule: true,
  default: () => false,
}));
jest.mock("@/hooks/useIsTouchDevice", () => ({
  __esModule: true,
  default: () => false,
}));
jest.mock("@/hooks/useDropVoters", () => ({
  useDropVoters: () => ({
    voters: [],
    isFetchingNextPage: false,
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
}));
jest.mock("@/hooks/useDropVoteLogs", () => ({
  useDropVoteLogs: () => ({
    logs: [],
    isFetchingNextPage: false,
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
}));
jest.mock("@/hooks/useIntersectionObserver", () => ({
  useIntersectionObserver: () => ({ current: null }),
}));

const winner: ApiWaveDecisionWinner = {
  drop: {
    id: 1,
    rating: 5,
    raters_count: 2,
    top_raters: [
      {
        profile: { id: "voter-1", handle: "alice", pfp: "alice.jpg" },
        rating: 3,
      },
    ],
    parts: [],
    metadata: [
      { data_key: "title", data_value: "T" },
      { data_key: "description", data_value: "D" },
    ],
    context_profile_context: { rating: 1 },
    author: { handle: "bob", level: 1, cic: 1 },
    created_at: 0,
    wave: { voting_credit_type: "votes" },
  },
} as any;
const wave: ApiWave = { voting: { credit_type: "votes" } } as any;

const useDeviceInfo = require("@/hooks/useDeviceInfo").default as jest.Mock;
const useLongPressInteraction = require("@/hooks/useLongPressInteraction")
  .default as jest.Mock;

describe("MemesWaveWinnersDrop", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMobileMenuOpenClick.mockClear();
    useDeviceInfo.mockReturnValue({ hasTouchScreen: false });
    useLongPressInteraction.mockReturnValue({
      isActive: false,
      setIsActive: jest.fn(),
      touchHandlers: {},
    });
  });

  it("calls convert helper and onDropClick", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    const { container } = render(
      <MemesWaveWinnersDrop winner={winner} wave={wave} onDropClick={onClick} />
    );
    expect(
      require("@/helpers/waves/drop.helpers").convertApiDropToExtendedDrop
    ).toHaveBeenCalledWith(winner.drop);
    await user.click(container.firstElementChild as HTMLElement);
    expect(onClick).toHaveBeenCalledWith({ id: "ext" });
    expect(screen.getByRole("heading", { name: "T" })).toHaveClass(
      "tw-mt-0",
      "tw-leading-tight"
    );
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByTestId("author-badges")).toBeInTheDocument();
    expect(screen.getByTestId("identity")).toBeInTheDocument();
    expect(screen.getByAltText("alice's profile picture")).toBeInTheDocument();
  });

  it("opens the mapped Meme card without opening the winner drop", async () => {
    const user = userEvent.setup();
    const onDropClick = jest.fn();
    render(
      <MemesWaveWinnersDrop
        winner={
          {
            ...winner,
            drop: {
              ...winner.drop,
              submission_context: { meme_card_id: 521 },
            },
          } as ApiWaveDecisionWinner
        }
        wave={wave}
        onDropClick={onDropClick}
      />
    );

    await user.click(screen.getByRole("link", { name: "The Memes #521" }));

    expect(onDropClick).not.toHaveBeenCalled();
    expect(
      screen.getByRole("link", { name: "The Memes #521" })
    ).toHaveAttribute("href", "/the-memes/521");
  });

  it("does not infer a Meme card link when the mapping is absent", () => {
    render(
      <MemesWaveWinnersDrop
        winner={winner}
        wave={wave}
        onDropClick={jest.fn()}
      />
    );

    expect(
      screen.queryByRole("link", { name: /The Memes #/ })
    ).not.toBeInTheDocument();
  });

  it("keeps native tap behavior for touch long-press handlers", () => {
    useDeviceInfo.mockReturnValue({ hasTouchScreen: true });

    render(
      <MemesWaveWinnersDrop
        winner={winner}
        wave={wave}
        onDropClick={jest.fn()}
      />
    );

    expect(useLongPressInteraction).toHaveBeenCalledWith({
      hasTouchScreen: true,
      onInteractionStart: expect.any(Function),
      preventDefault: false,
    });
  });

  it("uses v2 title and part one content before metadata fallbacks", () => {
    render(
      <MemesWaveWinnersDrop
        winner={
          {
            ...winner,
            drop: {
              ...winner.drop,
              title: "Part title",
              parts: [{ part_id: 1, content: "Part description", media: [] }],
            },
          } as ApiWaveDecisionWinner
        }
        wave={wave}
        onDropClick={jest.fn()}
      />
    );

    expect(screen.getByText("Part title")).toBeInTheDocument();
    expect(screen.getByText("Part description")).toBeInTheDocument();
    expect(screen.queryByText("T")).not.toBeInTheDocument();
    expect(screen.queryByText("D")).not.toBeInTheDocument();
  });

  it("shows vote details trigger for memes winners", () => {
    render(
      <MemesWaveWinnersDrop
        winner={winner}
        wave={wave}
        onDropClick={jest.fn()}
      />
    );

    expect(
      screen.getByRole("button", {
        name: "View voters and vote log for 2 voters",
      })
    ).toHaveClass(
      "tw-rounded-lg",
      "tw-border",
      "tw-border-iron-700",
      "tw-bg-iron-900/40"
    );
  });

  it("opens vote details without opening the winner card", async () => {
    const user = userEvent.setup();
    const onDropClick = jest.fn();

    render(
      <MemesWaveWinnersDrop
        winner={winner}
        wave={wave}
        onDropClick={onDropClick}
      />
    );

    await user.click(
      screen.getByRole("button", {
        name: "View voters and vote log for 2 voters",
      })
    );

    expect(onDropClick).not.toHaveBeenCalled();
    expect(
      await screen.findByRole("dialog", { name: "Votes" })
    ).toBeInTheDocument();
  });

  it("suppresses the click that follows a long press", async () => {
    const user = userEvent.setup();
    const onDropClick = jest.fn();
    useDeviceInfo.mockReturnValue({ hasTouchScreen: true });

    const { container } = render(
      <MemesWaveWinnersDrop
        winner={winner}
        wave={wave}
        onDropClick={onDropClick}
      />
    );

    const longPressOptions = useLongPressInteraction.mock.calls[0][0];
    longPressOptions.onInteractionStart();

    await user.click(container.firstElementChild as HTMLElement);
    expect(onDropClick).not.toHaveBeenCalled();

    await user.click(container.firstElementChild as HTMLElement);
    expect(onDropClick).toHaveBeenCalledTimes(1);
  });

  it("lets the first portal menu tap run after a long press", async () => {
    const user = userEvent.setup();
    const onDropClick = jest.fn();
    const setIsActive = jest.fn();
    useDeviceInfo.mockReturnValue({ hasTouchScreen: true });
    useLongPressInteraction.mockReturnValue({
      isActive: true,
      setIsActive,
      touchHandlers: {},
    });

    const { container } = render(
      <MemesWaveWinnersDrop
        winner={winner}
        wave={wave}
        onDropClick={onDropClick}
      />
    );

    const longPressOptions = useLongPressInteraction.mock.calls[0][0];
    longPressOptions.onInteractionStart();

    await user.click(screen.getByTestId("mobile"));
    expect(mockMobileMenuOpenClick).toHaveBeenCalledTimes(1);
    expect(setIsActive).toHaveBeenCalledWith(false);
    expect(onDropClick).not.toHaveBeenCalled();

    await user.click(container.firstElementChild as HTMLElement);
    expect(onDropClick).toHaveBeenCalledTimes(1);
  });
});
