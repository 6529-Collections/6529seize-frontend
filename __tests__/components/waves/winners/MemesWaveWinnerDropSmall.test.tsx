import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { MemesWaveWinnerDropSmall } from "@/components/waves/winners/MemesWaveWinnerDropSmall";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, onClick, className }: any) => (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  ),
}));
jest.mock("@/helpers/Helpers", () => ({
  formatNumberWithCommas: (n: number) => String(n),
}));
jest.mock("@/helpers/image.helpers", () => ({
  getScaledImageUri: (u: string) => "scaled-" + u,
  ImageScale: { W_AUTO_H_50: "50" },
}));
jest.mock("@/components/waves/winners/drops/DropContentSmall", () => ({
  DropContentSmall: () => <div data-testid="content" />,
}));
jest.mock("@/components/waves/winners/WaveWinnersSmallOutcome", () => ({
  WaveWinnersSmallOutcome: () => <div data-testid="outcome" />,
}));
jest.mock("@/components/waves/drops/winner/WinnerDropBadge", () => ({
  __esModule: true,
  default: ({ rank }: any) => <div data-testid="badge">{rank}</div>,
}));
jest.mock("@/components/waves/drops/time/WaveDropTime", () => ({
  __esModule: true,
  default: () => <span data-testid="time" />,
}));
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

describe("MemesWaveWinnerDropSmall", () => {
  const wave = { voting_credit_type: "REP" } as any;
  const baseDrop = {
    id: "drop-1",
    rank: 1,
    rating: -5,
    raters_count: 2,
    author: { handle: "alice", pfp: null },
    wave,
    context_profile_context: { rating: -1 },
    created_at: 0,
  } as any;

  it("handles click and displays rank override", async () => {
    const onClick = jest.fn();
    const user = userEvent.setup();
    const { container } = render(
      <MemesWaveWinnerDropSmall
        drop={baseDrop}
        wave={wave}
        rank={2}
        onDropClick={onClick}
      />
    );

    expect(screen.getByTestId("badge").textContent).toBe("2");
    await user.click(container.firstElementChild as HTMLElement);
    expect(onClick).toHaveBeenCalled();
    expect(screen.getByText("-5").className).toContain("rose");
    expect(screen.getByText("-1 REP").className).toContain("rose");
    expect(screen.getByTestId("identity")).toBeInTheDocument();
  });

  it("shows compact vote details trigger for memes winners", () => {
    render(
      <MemesWaveWinnerDropSmall
        drop={baseDrop}
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
      "tw-bg-iron-900/40",
      "tw-px-1.5",
      "tw-py-0.5"
    );
  });

  it("opens vote details without triggering the card click", async () => {
    const onClick = jest.fn();
    const user = userEvent.setup();

    render(
      <MemesWaveWinnerDropSmall
        drop={baseDrop}
        wave={wave}
        onDropClick={onClick}
      />
    );

    await user.click(
      screen.getByRole("button", {
        name: "View voters and vote log for 2 voters",
      })
    );

    expect(onClick).not.toHaveBeenCalled();
    expect(
      await screen.findByRole("dialog", { name: "Votes" })
    ).toBeInTheDocument();
  });
});
