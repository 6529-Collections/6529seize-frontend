import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { DefaultWaveLeaderboardDrop } from "@/components/waves/leaderboard/drops/DefaultWaveLeaderboardDrop";

jest.mock("@/hooks/drops/useDropInteractionRules", () => ({
  useDropInteractionRules: () => ({ canShowVote: true, canDelete: true }),
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ hasTouchScreen: false }),
}));
jest.mock("@/hooks/isMobileScreen", () => ({
  __esModule: true,
  default: () => false,
}));
jest.mock("@/hooks/useLongPressInteraction", () => ({
  __esModule: true,
  default: () => ({
    isActive: false,
    setIsActive: jest.fn(),
    touchHandlers: {},
  }),
}));

jest.mock("@/components/voting", () => ({
  VotingModal: ({ isOpen }: any) =>
    isOpen ? <div data-testid="modal" /> : null,
  MobileVotingModal: ({ isOpen }: any) =>
    isOpen ? <div data-testid="mobile" /> : null,
}));
jest.mock("@/components/voting/VotingModalButton", () => ({
  __esModule: true,
  default: (p: any) => <button data-testid="vote" onClick={p.onClick} />,
}));

jest.mock("@/components/waves/drops/WaveDropActionsOptions", () => ({
  __esModule: true,
  default: () => <div data-testid="options" />,
}));
jest.mock("@/components/waves/drops/WaveDropActionsOpen", () => ({
  __esModule: true,
  default: () => <div data-testid="open" />,
}));
jest.mock("@/components/waves/drops/WaveDropMobileMenuOpen", () => ({
  __esModule: true,
  default: () => <div data-testid="mobile-open" />,
}));
jest.mock("@/components/waves/drops/WaveDropMobileMenuDelete", () => ({
  __esModule: true,
  default: () => <div data-testid="mobile-delete" />,
}));

jest.mock(
  "@/components/waves/leaderboard/drops/header/WaveLeaderboardDropHeader",
  () => ({ WaveLeaderboardDropHeader: () => <div data-testid="header" /> })
);
jest.mock(
  "@/components/waves/leaderboard/content/WaveLeaderboardDropContent",
  () => ({ WaveLeaderboardDropContent: () => <div data-testid="content" /> })
);
jest.mock(
  "@/components/waves/leaderboard/drops/header/WaveleaderboardDropRaters",
  () => ({
    WaveLeaderboardDropRaters: (props: any) => (
      <div
        data-testid="raters"
        data-is-voting-closed={String(props.isVotingClosed)}
      />
    ),
  })
);

jest.mock(
  "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper",
  () => ({
    __esModule: true,
    default: ({ isOpen, children }: any) =>
      isOpen ? <div data-testid="mobile-wrapper">{children}</div> : null,
  })
);

describe("DefaultWaveLeaderboardDrop", () => {
  const drop: any = {
    id: "1",
    rank: 1,
    wave: { id: "w1" },
    author: {
      handle: "alice",
      primary_address: "0xalice",
      pfp: null,
    },
    context_profile_context: { curatable: true, curated: false },
  };

  it("applies border classes based on rank", () => {
    const { container } = render(
      <DefaultWaveLeaderboardDrop
        drop={{ ...drop, rank: 2 }}
        onDropClick={jest.fn()}
      />
    );
    expect(container.innerHTML).toContain("tw-border-iron-800");
  });

  it("opens voting modal when button clicked", () => {
    render(<DefaultWaveLeaderboardDrop drop={drop} onDropClick={jest.fn()} />);
    fireEvent.click(screen.getByTestId("vote"));
    expect(screen.getByTestId("modal")).toBeInTheDocument();
  });

  it("closes voting modal when voting closes", () => {
    const { rerender } = render(
      <DefaultWaveLeaderboardDrop drop={drop} onDropClick={jest.fn()} />
    );

    fireEvent.click(screen.getByTestId("vote"));
    expect(screen.getByTestId("modal")).toBeInTheDocument();

    rerender(
      <DefaultWaveLeaderboardDrop
        drop={drop}
        onDropClick={jest.fn()}
        isVotingClosed={true}
      />
    );

    expect(screen.queryByTestId("modal")).toBeNull();
    expect(screen.queryByTestId("vote")).toBeNull();
  });

  it("hides vote action while controls are locked without showing closed state", () => {
    render(
      <DefaultWaveLeaderboardDrop
        drop={drop}
        onDropClick={jest.fn()}
        isVotingClosed={false}
        isVotingControlsLocked={true}
      />
    );

    expect(screen.queryByTestId("vote")).toBeNull();
    expect(screen.getByTestId("raters")).toHaveAttribute(
      "data-is-voting-closed",
      "false"
    );
  });

  it("closes voting modal when controls become locked", () => {
    const { rerender } = render(
      <DefaultWaveLeaderboardDrop drop={drop} onDropClick={jest.fn()} />
    );

    fireEvent.click(screen.getByTestId("vote"));
    expect(screen.getByTestId("modal")).toBeInTheDocument();

    rerender(
      <DefaultWaveLeaderboardDrop
        drop={drop}
        onDropClick={jest.fn()}
        isVotingControlsLocked={true}
      />
    );

    expect(screen.queryByTestId("modal")).toBeNull();
    expect(screen.queryByTestId("vote")).toBeNull();
  });

  it("hides voting button when voting is closed", () => {
    render(
      <DefaultWaveLeaderboardDrop
        drop={drop}
        onDropClick={jest.fn()}
        isVotingClosed={true}
      />
    );

    expect(screen.queryByTestId("vote")).toBeNull();
  });

  it("calls onDropClick", () => {
    const onClick = jest.fn();
    const { container } = render(
      <DefaultWaveLeaderboardDrop drop={drop} onDropClick={onClick} />
    );
    fireEvent.click(container.firstChild as HTMLElement);
    expect(onClick).toHaveBeenCalled();
  });
});
