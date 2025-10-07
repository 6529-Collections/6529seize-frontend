import { NftPageStats } from "@/components/nft-attributes/NftStats";
import { render, screen, within } from "@testing-library/react";

describe("NftPageStats", () => {
  const nft = {
    mint_price: 0.123456,
    hodl_rate: 0.456,
    floor_price: 1.2345,
    market_cap: 987.654,
    highest_offer: 2.345,
  } as any;

  it("renders formatted stats rows", () => {
    render(
      <table>
        <tbody>
          <NftPageStats nft={nft} />
        </tbody>
      </table>
    );

    const rows = screen.getAllByRole("row");
    expect(within(rows[0]).getByText("Mint Price")).toBeInTheDocument();
    expect(within(rows[0]).getByText("0.12346 ETH")).toBeInTheDocument();

    expect(within(rows[1]).getByText("TDH Rate")).toBeInTheDocument();
    expect(within(rows[1]).getByText("0.46")).toBeInTheDocument();

    expect(within(rows[2]).getByText("Floor Price")).toBeInTheDocument();
    expect(within(rows[2]).getByText("1.235 ETH")).toBeInTheDocument();

    expect(within(rows[3]).getByText("Market Cap")).toBeInTheDocument();
    expect(within(rows[3]).getByText("987.65 ETH")).toBeInTheDocument();

    expect(within(rows[4]).getByText("Highest Offer")).toBeInTheDocument();
    expect(within(rows[4]).getByText("2.345 ETH")).toBeInTheDocument();
  });

  it("shows N/A when value is zero", () => {
    render(
      <table>
        <tbody>
          <NftPageStats nft={{ ...nft, highest_offer: 0 }} />
        </tbody>
      </table>
    );
    const lastRow = screen.getAllByRole("row")[4];
    expect(within(lastRow).getByText("N/A")).toBeInTheDocument();
  });
});
