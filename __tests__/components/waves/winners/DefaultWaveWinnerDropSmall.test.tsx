import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DefaultWaveWinnerDropSmall } from "@/components/waves/winners/DefaultWaveWinnerDropSmall";
import { screen } from "@testing-library/react";

const mockDropContentSmall = jest.fn(() => <div data-testid="content" />);

jest.mock("@/components/waves/winners/drops/DropContentSmall", () => ({
  DropContentSmall: (props: any) => mockDropContentSmall(props),
}));
jest.mock("@/components/waves/winners/WaveWinnersSmallOutcome", () => ({
  WaveWinnersSmallOutcome: () => <div data-testid="outcome" />,
}));
jest.mock("@/components/waves/drops/winner/WinnerDropBadge", () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="badge">{props.rank}</div>,
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

const baseDrop = {
  id: "drop-1",
  rating: 5,
  raters_count: 1,
  author: { handle: "alice", pfp: null },
  wave: { voting_credit_type: "REP" },
  parts: [{}],
  context_profile_context: { rating: 2 },
  metadata: [],
  mentioned_users: [],
  referenced_nfts: [],
  created_at: 0,
} as any;

describe("DefaultWaveWinnerDropSmall", () => {
  beforeEach(() => {
    mockDropContentSmall.mockClear();
  });

  it("handles click and shows user vote", async () => {
    const onDropClick = jest.fn();
    const user = userEvent.setup();
    const { container } = render(
      <DefaultWaveWinnerDropSmall drop={baseDrop} onDropClick={onDropClick} />
    );
    await user.click(container.firstElementChild as HTMLElement);
    expect(onDropClick).toHaveBeenCalled();
    expect(screen.getByTestId("identity")).toBeInTheDocument();
  });

  it("forwards content presentation to small content", () => {
    render(
      <DefaultWaveWinnerDropSmall
        drop={baseDrop}
        onDropClick={jest.fn()}
        contentPresentation="quorumCompact"
      />
    );

    expect(mockDropContentSmall).toHaveBeenCalledWith(
      expect.objectContaining({
        contentPresentation: "quorumCompact",
      })
    );
  });

  it("shows compact vote details trigger for normal winners", () => {
    render(
      <DefaultWaveWinnerDropSmall
        drop={{ ...baseDrop, raters_count: 2 }}
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
});
