import { render, screen } from "@testing-library/react";
import UserPageStatsTags from "@/components/user/stats/tags/UserPageStatsTags";

const ownerBalance = {
  nextgen_balance: 2,
  memes_cards_sets: 3,
  memes_balance: 4,
  unique_memes: 3,
  gradients_balance: 1,
  boost: 5,
} as any;

describe("UserPageStatsTags", () => {
  it("renders the main metrics as label and value blocks", () => {
    render(<UserPageStatsTags ownerBalance={ownerBalance} balanceMemes={[]} />);

    expect(screen.getByText("NextGen")).toBeInTheDocument();
    expect(screen.getByText("x2")).toBeInTheDocument();
    expect(screen.getByText("Meme Sets")).toBeInTheDocument();
    expect(screen.getByText("x3")).toBeInTheDocument();
    expect(screen.getByText("Memes")).toBeInTheDocument();
    expect(screen.getByText("x4")).toBeInTheDocument();
    expect(screen.getByText("Gradients")).toBeInTheDocument();
    expect(screen.getByText("x1")).toBeInTheDocument();
    expect(screen.getByText("Boost")).toBeInTheDocument();
    expect(screen.getByText("x5")).toBeInTheDocument();
  });

  it("shows meme unique count as subtext only when it differs from total", () => {
    const { rerender } = render(
      <UserPageStatsTags ownerBalance={ownerBalance} balanceMemes={[]} />
    );

    expect(screen.getByText("unique x3")).toBeInTheDocument();

    rerender(
      <UserPageStatsTags
        ownerBalance={{
          ...ownerBalance,
          unique_memes: ownerBalance.memes_balance,
        }}
        balanceMemes={[]}
      />
    );

    expect(screen.queryByText("unique x4")).not.toBeInTheDocument();
    expect(screen.queryByText(/unique x/i)).not.toBeInTheDocument();
  });

  it("keeps season pills rendered below the main metrics", () => {
    render(
      <UserPageStatsTags
        ownerBalance={ownerBalance}
        balanceMemes={
          [
            { season: 1, sets: 2 },
            { season: 2, sets: 0 },
          ] as any
        }
      />
    );

    expect(screen.getByText("SZN1 Sets x2")).toBeInTheDocument();
    expect(screen.queryByText("SZN2 Sets x0")).not.toBeInTheDocument();
  });

  it("renders no visible stats content when all rows are empty", () => {
    const { container } = render(
      <UserPageStatsTags ownerBalance={undefined} balanceMemes={[]} />
    );

    expect(container.firstChild).toBeEmptyDOMElement();
  });
});
