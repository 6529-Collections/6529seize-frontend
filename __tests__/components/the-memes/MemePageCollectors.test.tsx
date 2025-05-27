import { render, screen } from "@testing-library/react";
import React from "react";
import {
  MemePageCollectorsRightMenu,
  MemePageCollectorsSubMenu,
} from "../../../components/the-memes/MemePageCollectors";

jest.mock("../../../helpers/Helpers", () => ({
  numberWithCommas: jest.fn((n) => n.toString()),
  printMintDate: jest.fn(() => "date"),
}));

let leaderboardProps: any;
jest.mock("../../../components/leaderboard/NFTLeaderboard", () => (props: any) => {
  leaderboardProps = props;
  return <div data-testid="leaderboard" />;
});

jest.mock("../../../components/nftAttributes/NftStats", () => ({
  NftPageStats: () => <tr data-testid="stats" />,
}));

const nft = {
  id: 1,
  contract: "0x123",
  mint_date: "2020-01-01" as any,
  boosted_tdh: 1.23,
  tdh__raw: 4.56,
  tdh_rank: 7,
} as any;


describe("MemePageCollectorsRightMenu", () => {
  it("renders NFT details when shown", () => {
    render(<MemePageCollectorsRightMenu show nft={nft} />);
    expect(screen.getByText("NFT")).toBeInTheDocument();
    expect(screen.getAllByText("TDH").length).toBeGreaterThan(0);
    expect(screen.getByTestId("stats")).toBeInTheDocument();
  });

  it("returns null when not shown", () => {
    const { container } = render(<MemePageCollectorsRightMenu show={false} nft={nft} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("MemePageCollectorsSubMenu", () => {
  it("passes contract and id to leaderboard", () => {
    render(<MemePageCollectorsSubMenu show nft={nft} />);
    expect(screen.getByTestId("leaderboard")).toBeInTheDocument();
    expect(leaderboardProps.contract).toBe("0x123");
    expect(leaderboardProps.nftId).toBe(1);
  });

  it("returns null when nft missing", () => {
    const { container } = render(<MemePageCollectorsSubMenu show nft={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });
});

