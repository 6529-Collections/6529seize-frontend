import {
  MemePageCollectorsRightMenu,
  MemePageCollectorsSubMenu,
} from "@/components/the-memes/MemePageCollectors";
import { render, screen } from "@testing-library/react";

jest.mock("@/helpers/Helpers", () => ({
  numberWithCommas: jest.fn((n) => n.toString()),
  printMintDate: jest.fn(() => "date"),
}));

let leaderboardProps: any;
jest.mock("@/components/leaderboard/NFTLeaderboard", () => (props: any) => {
  leaderboardProps = props;
  return <div data-testid="leaderboard" />;
});

const nft = {
  id: 1,
  contract: "0x123",
  mint_date: "2020-01-01" as any,
  boosted_tdh: 1.23,
  tdh__raw: 4.56,
  tdh_rank: 7,
} as any;

const nftMeta = {
  burnt: 1,
  collection_size: 100,
  edition_size: 10,
  edition_size_rank: 2,
  edition_size_cleaned: 8,
  edition_size_cleaned_rank: 3,
  edition_size_not_burnt: 9,
  edition_size_not_burnt_rank: 4,
  hodlers: 6,
  hodlers_rank: 5,
  museum_holdings: 2,
  museum_holdings_rank: 6,
  percent_unique: 0.6,
  percent_unique_rank: 7,
  percent_unique_not_burnt: 0.66,
  percent_unique_not_burnt_rank: 8,
  percent_unique_cleaned: 0.75,
  percent_unique_cleaned_rank: 9,
} as any;

describe("MemePageCollectorsRightMenu", () => {
  it("renders TDH breakdown when shown", () => {
    render(<MemePageCollectorsRightMenu show nft={nft} />);
    expect(
      screen.getByRole("heading", { name: "TDH breakdown" })
    ).toBeInTheDocument();
    expect(screen.getAllByText("TDH").length).toBeGreaterThan(0);
    expect(screen.getByText("Unweighted TDH")).toBeInTheDocument();
    expect(screen.getByText("Meme Rank")).toBeInTheDocument();
    expect(screen.getByText("1.23")).toBeInTheDocument();
    expect(screen.getByText("4.56")).toBeInTheDocument();
    expect(screen.getByText("#7")).toBeInTheDocument();
  });

  it("returns null when not shown", () => {
    const { container } = render(
      <MemePageCollectorsRightMenu show={false} nft={nft} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe("MemePageCollectorsSubMenu", () => {
  it("passes contract and id to leaderboard", () => {
    render(<MemePageCollectorsSubMenu show nft={nft} nftMeta={nftMeta} />);
    expect(
      screen.getByRole("heading", { name: "Meme Collectors" })
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        "Unique % represents collectors diversity. Higher percentage means more different collectors."
      )
    ).toBeInTheDocument();
    expect(screen.getByTestId("leaderboard")).toBeInTheDocument();
    expect(leaderboardProps.contract).toBe("0x123");
    expect(leaderboardProps.nftId).toBe(1);
  });

  it("returns null when nft missing", () => {
    const { container } = render(
      <MemePageCollectorsSubMenu show nft={undefined} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
