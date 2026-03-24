import { NftPageStats } from "@/components/nft-attributes/NftStats";
import { render, screen, within } from "@testing-library/react";

describe("NftPageStats", () => {
  const nft = {
    uri: "https://example.com/metadata/1",
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

    expect(within(rows[1]).getByText("Metadata")).toBeInTheDocument();
    const metadataLink = within(rows[1]).getByRole("link", { name: "View" });
    expect(metadataLink).toHaveAttribute(
      "href",
      "https://example.com/metadata/1"
    );
    expect(metadataLink).toHaveAttribute("target", "_blank");
    expect(metadataLink).toHaveAttribute("rel", "noopener noreferrer");

    expect(within(rows[2]).getByText("TDH Rate")).toBeInTheDocument();
    expect(within(rows[2]).getByText("0.46")).toBeInTheDocument();

    expect(within(rows[3]).getByText("Floor Price")).toBeInTheDocument();
    expect(within(rows[3]).getByText("1.235 ETH")).toBeInTheDocument();

    expect(within(rows[4]).getByText("Market Cap")).toBeInTheDocument();
    expect(within(rows[4]).getByText("987.65 ETH")).toBeInTheDocument();

    expect(within(rows[5]).getByText("Highest Offer")).toBeInTheDocument();
    expect(within(rows[5]).getByText("2.345 ETH")).toBeInTheDocument();
  });

  it("shows N/A when value is zero", () => {
    render(
      <table>
        <tbody>
          <NftPageStats nft={{ ...nft, highest_offer: 0 }} />
        </tbody>
      </table>
    );
    const lastRow = screen.getAllByRole("row")[5];
    expect(within(lastRow).getByText("N/A")).toBeInTheDocument();
  });

  it("omits the metadata row when the url is blank", () => {
    render(
      <table>
        <tbody>
          <NftPageStats nft={{ ...nft, uri: " " }} />
        </tbody>
      </table>
    );

    expect(screen.queryByText("Metadata")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "View" })
    ).not.toBeInTheDocument();
  });
});
