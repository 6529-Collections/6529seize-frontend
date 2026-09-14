import { MemePageActivity } from "@/components/the-memes/MemePageActivity";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { NFT } from "@/entities/INFT";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockNftMarketActivity = jest.fn(
  ({
    contract,
    tokenId,
    filter,
    locale,
  }: {
    contract: string;
    tokenId: string;
    filter: string;
    locale?: string;
  }) => (
    <div
      data-testid="nft-market-activity"
      data-contract={contract}
      data-token-id={tokenId}
      data-filter={filter}
      data-locale={locale}
    />
  )
);

jest.mock("@/components/nft-market-activity/NftMarketActivity", () => ({
  __esModule: true,
  default: (props: {
    contract: string;
    tokenId: string;
    filter: string;
    locale?: string;
  }) => mockNftMarketActivity(props),
}));

const nft = {
  id: 7,
  contract: MEMES_CONTRACT,
  total_volume_last_24_hours: 1.25,
  total_volume_last_7_days: 2.5,
  total_volume_last_1_month: 3.75,
  total_volume: 10,
} as NFT;

describe("MemePageActivity", () => {
  beforeEach(() => jest.clearAllMocks());

  it("does not mount activity when the card activity tab is hidden", () => {
    const { container } = render(
      <MemePageActivity show={false} nft={nft} pageSize={25} />
    );
    expect(container).toBeEmptyDOMElement();
    expect(mockNftMarketActivity).not.toHaveBeenCalled();
  });

  it("renders volume and the merged card activity for the exact token", () => {
    render(<MemePageActivity show nft={nft} pageSize={25} />);

    expect(screen.getByText("Card Activity")).toBeInTheDocument();
    expect(screen.getByText("1.25 ETH")).toBeInTheDocument();
    expect(screen.getByTestId("nft-market-activity")).toHaveAttribute(
      "data-contract",
      MEMES_CONTRACT
    );
    expect(screen.getByTestId("nft-market-activity")).toHaveAttribute(
      "data-token-id",
      "7"
    );
    expect(screen.getByTestId("nft-market-activity")).toHaveAttribute(
      "data-filter",
      "all"
    );
  });

  it("passes the route locale to merged card activity", () => {
    render(<MemePageActivity show nft={nft} pageSize={25} locale="de-DE" />);

    expect(screen.getByTestId("nft-market-activity")).toHaveAttribute(
      "data-locale",
      "de-DE"
    );
  });

  it("passes marketplace filters to the merged card activity", async () => {
    const user = userEvent.setup();
    render(<MemePageActivity show nft={nft} pageSize={25} />);

    await user.click(
      screen.getByRole("button", { name: "Transaction Type: All activity" })
    );
    await user.click(screen.getByRole("menuitem", { name: "Cancellations" }));

    expect(screen.getByTestId("nft-market-activity")).toHaveAttribute(
      "data-filter",
      "cancellations"
    );
  });
});
