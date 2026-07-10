import { render, screen } from "@testing-library/react";
import ParticipationDropFooter from "@/components/waves/drops/participation/ParticipationDropFooter";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

const useDropInteractionRules = jest.fn();
jest.mock("@/hooks/drops/useDropInteractionRules", () => ({
  useDropInteractionRules: (...args: any[]) => useDropInteractionRules(...args),
}));

jest.mock("@/components/waves/drops/WaveDropReactions", () => ({
  __esModule: true,
  default: () => <div data-testid="reactions" />,
}));

jest.mock(
  "@/components/waves/drops/participation/ParticipationDropRatings",
  () => ({
    ParticipationDropRatings: (props: any) => (
      <div
        data-testid="ratings"
        data-rank={props.rank ?? ""}
        data-winning-threshold={props.winningThreshold ?? ""}
        data-is-voting-closed={String(props.isVotingClosed)}
      />
    ),
  })
);

const createDrop = (overrides: Partial<ExtendedDrop> = {}): ExtendedDrop =>
  ({
    id: "drop-1",
    wave: { id: "wave-1" },
    raters_count: 2,
    rank: 3,
    reactions: [],
    context_profile_context: null,
    ...overrides,
  }) as ExtendedDrop;

describe("ParticipationDropFooter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDropInteractionRules.mockReturnValue({ canShowVote: true });
  });

  it("renders ratings when the drop has raters", () => {
    render(<ParticipationDropFooter drop={createDrop()} />);

    expect(screen.getByTestId("ratings")).toHaveAttribute("data-rank", "3");
  });

  it("renders threshold ratings even when raters_count is 0", () => {
    render(
      <ParticipationDropFooter
        drop={createDrop({ raters_count: 0 })}
        winningThreshold={10}
      />
    );

    expect(screen.getByTestId("ratings")).toHaveAttribute(
      "data-winning-threshold",
      "10"
    );
  });

  it("passes closed voting state to ratings", () => {
    render(
      <ParticipationDropFooter
        drop={createDrop({ raters_count: 0 })}
        winningThreshold={10}
        isVotingClosed={true}
      />
    );

    expect(screen.getByTestId("ratings")).toHaveAttribute(
      "data-is-voting-closed",
      "true"
    );
  });

  it("right-aligns approval vote actions on narrow footer rows", () => {
    render(
      <ParticipationDropFooter
        drop={createDrop({ raters_count: 0 })}
        winningThreshold={10}
        voteAction={<button data-testid="vote-action" type="button" />}
      />
    );

    const actionRow = screen.getByTestId("vote-action").parentElement;
    expect(actionRow).toHaveClass("tw-justify-end");
    expect(actionRow).toHaveClass("tw-border-t");
    expect(actionRow).toHaveClass("@[700px]:tw-border-none");
  });

  it("keeps default vote actions centered on narrow footer rows", () => {
    render(
      <ParticipationDropFooter
        drop={createDrop()}
        voteAction={<button data-testid="vote-action" type="button" />}
      />
    );

    expect(screen.getByTestId("vote-action").parentElement).toHaveClass(
      "tw-justify-center"
    );
  });

  it("keeps approval reactions above the approval footer controls", () => {
    render(
      <ParticipationDropFooter
        drop={createDrop({
          raters_count: 0,
          reactions: [{ reaction: "like", profiles: [] }] as any,
        })}
        winningThreshold={10}
        voteAction={<button data-testid="vote-action" type="button" />}
      />
    );

    const order = screen
      .getByTestId("reactions")
      .compareDocumentPosition(screen.getByTestId("vote-action"));
    expect(order & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("keeps default reactions below default footer controls", () => {
    render(
      <ParticipationDropFooter
        drop={createDrop({
          reactions: [{ reaction: "like", profiles: [] }] as any,
        })}
        voteAction={<button data-testid="vote-action" type="button" />}
      />
    );

    const order = screen
      .getByTestId("vote-action")
      .compareDocumentPosition(screen.getByTestId("reactions"));
    expect(order & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("locks voting actions without marking ratings closed", () => {
    render(
      <ParticipationDropFooter
        drop={createDrop({ raters_count: 0 })}
        winningThreshold={10}
        isVotingControlsLocked={true}
        voteAction={<button data-testid="vote-action" type="button" />}
      />
    );

    expect(screen.queryByTestId("vote-action")).not.toBeInTheDocument();
    expect(screen.getByTestId("ratings")).toHaveAttribute(
      "data-is-voting-closed",
      "false"
    );
  });

  it("does not render ratings when there are no raters and no threshold", () => {
    render(<ParticipationDropFooter drop={createDrop({ raters_count: 0 })} />);

    expect(screen.queryByTestId("ratings")).not.toBeInTheDocument();
  });

  it("keeps reactions visible when voting is closed", () => {
    render(
      <ParticipationDropFooter
        drop={createDrop({
          raters_count: 0,
          reactions: [{ reaction: "like", profiles: [] }] as any,
        })}
        isVotingClosed={true}
      />
    );

    expect(screen.getByTestId("reactions")).toBeInTheDocument();
  });
});
