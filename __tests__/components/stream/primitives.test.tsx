import { render, screen, within } from "@testing-library/react";

import BarList from "@/components/stream/diagrams/BarList";
import OrderBookTable from "@/components/stream/diagrams/OrderBookTable";
import TierComparison from "@/components/stream/diagrams/TierComparison";
import Countdown from "@/components/stream/ui/Countdown";
import EthAmount from "@/components/stream/ui/EthAmount";
import GasNote, { txErrorMessage } from "@/components/stream/ui/GasNote";
import StatusBadge from "@/components/stream/ui/StatusBadge";
import { clear } from "@/lib/stream/clearing";
import { stepTotalRows } from "@/lib/stream/editionViews";
import { parseEthToWei } from "@/lib/stream/eth";
import { GAS_ESTIMATES } from "@/lib/stream/gas";
import { ladderPrices } from "@/lib/stream/ladder";

const eth = (text: string) => parseEthToWei(text) ?? 0n;

describe("6529 Stream primitives", () => {
  it("shows ETH exactly, with the full value in the data element", () => {
    const { container } = render(
      <EthAmount wei={eth("4.088")} locale="en-US" />
    );
    expect(screen.getByText("4.088 ETH")).toBeInTheDocument();
    expect(container.querySelector("data")?.getAttribute("value")).toBe(
      "4.088"
    );
    render(<EthAmount wei={eth("1234.5")} locale="de-DE" />);
    expect(screen.getByText("1.234,5 ETH")).toBeInTheDocument();
  });

  it("counts down and flags the anti-snipe window", () => {
    const { rerender } = render(
      <Countdown
        endTime={10_000}
        now={10_000 - 3 * 3_600 - 12 * 60}
        locale="en-US"
        closeWindow={900}
      />
    );
    expect(screen.getByRole("timer")).toHaveTextContent("Ends in 3h 12m");
    expect(screen.queryByText("A bid now adds 15 min")).not.toBeInTheDocument();
    rerender(
      <Countdown
        endTime={10_000}
        now={10_000 - 125}
        locale="en-US"
        closeWindow={900}
      />
    );
    expect(screen.getByRole("timer")).toHaveTextContent("Ends in 2m 05s");
    expect(screen.getByText("A bid now adds 15 min")).toBeInTheDocument();
    rerender(
      <Countdown
        endTime={10_000}
        now={10_001}
        locale="en-US"
        closeWindow={900}
      />
    );
    expect(screen.getByRole("timer")).toHaveTextContent("Ended");
    rerender(
      <Countdown
        endTime={10_000}
        now={10_000 - 125}
        locale="de-DE"
        closeWindow={900}
      />
    );
    expect(screen.getByRole("timer")).toHaveTextContent("Ends in 2m 05s");
  });

  it("draws an order book with a price line under the clearing price", () => {
    const prices = ladderPrices();
    const live = new Array<number>(prices.length).fill(0);
    live[192] = 1;
    live[158] = 9;
    live[144] = 20;
    live[130] = 50;
    live[96] = 200;
    const result = clear(live, prices);
    render(
      <OrderBookTable
        rows={stepTotalRows(live, prices, 0, result)}
        count={result.count}
        clearingStep={result.step}
        locale="en-US"
      />
    );
    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");
    expect(rows[0]).toHaveTextContent("PriceEditionsTotal so far");
    expect(rows[1]).toHaveTextContent("1 ETH11In");
    expect(
      screen.getByText("Price line: 80 at 0.0511 ETH")
    ).toBeInTheDocument();
    expect(rows.at(-1)).toHaveTextContent("0.01 ETH200280Out");
  });

  it("lists comparisons as bars with their values", () => {
    render(
      <BarList
        label="Possible results"
        marker={0.9}
        markerLabel="Dashed line: 90% of the most."
        items={[
          {
            key: "a",
            label: "80 × 0.0511",
            fraction: 1,
            value: "4.088 ETH",
            tag: "sells",
            emphasis: true,
          },
          { key: "b", label: "280 × 0.01", fraction: 0.68, value: "2.8 ETH" },
        ]}
      />
    );
    const list = screen.getByRole("list", { name: "Possible results" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("sells")).toBeInTheDocument();
  });

  it("compares the three tiers in a real table", () => {
    render(<TierComparison locale="en-US" />);
    expect(
      screen.getByRole("columnheader", { name: "Federated" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("row", { name: /Split 50\/50 75\/25 90\/10/ })
    ).toBeInTheDocument();
  });

  it("uses compact labels, never pills", () => {
    render(<StatusBadge tone="live" label="Live" />);
    expect(screen.getByText("Live").className).not.toContain("rounded-full");
  });

  it("labels every gas figure with its source", () => {
    const { rerender } = render(
      <GasNote estimate={GAS_ESTIMATES.auctionBid} locale="en-US" />
    );
    expect(
      screen.getByText(
        "About 169K gas · Sepolia r2, Glamsterdam, measured Oct 11, 2026"
      )
    ).toBeInTheDocument();
    rerender(<GasNote estimate={GAS_ESTIMATES.auctionBid} locale="de-DE" />);
    expect(
      screen.getByText(
        "About 169.000 gas · Sepolia r2, Glamsterdam, measured 11.10.2026"
      )
    ).toBeInTheDocument();
    rerender(
      <GasNote estimate={GAS_ESTIMATES.federatedDeploySingle} locale="en-US" />
    );
    expect(
      screen.getByText("About 4M–5M gas · design estimate, per contract")
    ).toBeInTheDocument();
  });

  it("explains known reverts and names unknown ones", () => {
    expect(txErrorMessage("en-US", { code: "BidTooLow" })).toBe(
      "Your bid is below the minimum."
    );
    expect(txErrorMessage("en-US", { code: "Mystery" })).toBe(
      "The transaction failed: Mystery."
    );
  });
});
