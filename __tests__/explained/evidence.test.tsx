import { webcrypto } from "node:crypto";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AgreementBars from "@/components/explained/evidence/AgreementBars";
import AssuranceLadder from "@/components/explained/evidence/AssuranceLadder";
import BrowserHash from "@/components/explained/evidence/BrowserHash";
import DayRibbon, {
  DayTile,
  dayKindOf,
  ribbonDays,
  type ResultDay,
} from "@/components/explained/evidence/DayRibbon";
import Equation from "@/components/explained/evidence/Equation";
import LiveStrip from "@/components/explained/evidence/LiveStrip";
import Receipt from "@/components/explained/evidence/Receipt";
import {
  SimulationButton,
  SimulationSwitch,
  WhenReal,
  WhenSimulated,
} from "@/components/explained/evidence/Simulation";
import Verdict from "@/components/explained/evidence/Verdict";
import { pageToMarkdown } from "@/components/explained/shell/pageMarkdown";
import { createFactBook } from "@/lib/explained/facts";
import {
  fixtureDayText,
  fixtureFactInputs,
} from "@/lib/explained/fixtureInputs";

const book = createFactBook(fixtureFactInputs());

describe("the verdict and the equation", () => {
  it("says the verdict with its mark and keeps the limit inside the block", () => {
    const { container } = render(
      <Verdict
        state="equal"
        date={book.get("tdh.latest.date")}
        cycle={book.get("tdh.latest.cycle")}
        headline="6529.io matches."
        locale="en-US"
      >
        <p>Not guaranteed: the history before the snapshot.</p>
      </Verdict>
    );
    const block = container.querySelector('[data-verdict="equal"]');
    expect(block).toHaveAccessibleName("Equal");
    expect(block?.querySelector('[data-glyph="tested"]')).not.toBeNull();
    expect(block).toHaveTextContent("October 18, 2026 · cycle 20,744");
    expect(block).toHaveTextContent(
      "Not guaranteed: the history before the snapshot."
    );
  });

  it("names a known cause as such, never as Explained", () => {
    render(
      <Verdict
        state="knownCause"
        date={null}
        cycle={null}
        headline="x"
        locale="en-US"
      />
    );
    expect(screen.getByText("Known cause")).toBeInTheDocument();
    expect(screen.queryByText("Explained")).not.toBeInTheDocument();
  });

  it("marks a constructed failing day Simulated", () => {
    render(
      <Verdict
        state="simulated"
        date={null}
        cycle={null}
        headline="6529.io differs."
        incident={{ steps: ["Detected", "Classed D", "Fixed"], done: 2 }}
        locale="en-US"
      />
    );
    expect(screen.getByText("Simulated")).toBeInTheDocument();
    expect(
      screen.getByText("a constructed day, not a real one")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Incident steps" }).children
    ).toHaveLength(3);
  });

  it("reads = and ≠ from the values themselves", () => {
    const total = book.get("tdh.latest.total");
    const { container } = render(
      <Equation
        label="Total TDH"
        locale="en-US"
        rows={[
          { who: "Rust core", sub: "computed", value: total },
          {
            who: "Python reference",
            sub: "again",
            value: book.get("tdh.latest.total.python"),
          },
          { who: "6529.io", sub: "upload", value: { ...total, value: 1 } },
        ]}
      />
    );
    const relations = [...container.querySelectorAll("[data-relation]")].map(
      (row) => row.getAttribute("data-relation")
    );
    expect(relations).toEqual(["first", "equal", "differs"]);
    expect(screen.getByLabelText("differs from")).toHaveTextContent("≠");
  });
});

describe("the ribbon", () => {
  const days = book.get<ResultDay[]>("tdh.days").value;

  it("lays out every result, the open day, the days to come and the cutover", () => {
    const tiles = ribbonDays({
      days,
      open: { date: "2026-10-19", minutesLeft: 860, progress: 40.3 },
      cutover: "2026-10-23",
    });
    expect(tiles.map((tile) => tile.kind)).toEqual([
      "equal",
      "equal",
      "equal",
      "equal",
      "equal",
      "open",
      "future",
      "future",
      "future",
      "cutover",
    ]);
    expect(tiles.filter((tile) => tile.hideOnPhone)).toHaveLength(3);
    render(<DayRibbon days={tiles} locale="en-US" />);
    expect(
      screen.getByRole("list", { name: "Every result so far" }).children
    ).toHaveLength(10);
    expect(
      screen.getByRole("img", {
        name: "Oct 14, cycle 20,740: Equal, rewritten Oct 16",
      })
    ).toHaveAttribute("data-rewritten", "");
    expect(
      screen.getByRole("img", {
        name: "Oct 19: open, the result in 14 h 20 min",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "about Oct 23: the cutover" })
    ).toBeInTheDocument();
  });

  it("maps the feed's verdicts onto the marks", () => {
    expect(dayKindOf("OK")).toBe("equal");
    expect(dayKindOf("LIVE_UNEXPLAINED")).toBe("differs");
    expect(dayKindOf("RUST_PYTHON_MISMATCH")).toBe("differs");
    render(
      <DayTile kind="missing" date="2026-10-11" cycle={20737} locale="en-US" />
    );
    expect(
      screen.getByRole("img", {
        name: "Oct 11, cycle 20,737: No file for this day",
      })
    ).toBeInTheDocument();
  });

  it("colours each tile of the live strip by its day's verdict", () => {
    const [first, second] = days;
    if (!first || !second) throw new Error("the fixture has days");
    const { container } = render(
      <LiveStrip
        headline="total"
        days={[first, { ...second, verdict: "LIVE_UNEXPLAINED" }]}
        locale="en-US"
      >
        line
      </LiveStrip>
    );
    const tiles = [...container.querySelectorAll("[data-day-kind]")];
    expect(tiles.map((tile) => tile.getAttribute("data-day-kind"))).toEqual([
      "equal",
      "differs",
    ]);
    expect(tiles[1]?.className).toContain("tw-border-error/60");
    expect(tiles[1]?.getAttribute("aria-label")).toMatch(/Differs/i);
    // The newest result differs, so the strip is not green.
    expect(container.querySelector("[data-livestrip]")?.className).toContain(
      "tw-border-error/40"
    );
  });
});

describe("the receipt", () => {
  it("keeps its rows in the fixed order", () => {
    const { container } = render(
      <Receipt
        cycle="20,744"
        locale="en-US"
        rows={[
          { id: "result", value: "Oct 18" },
          { id: "verdict", value: "Equal" },
          { id: "file", value: "1c01…" },
        ]}
      />
    );
    expect(
      [...container.querySelectorAll("[data-receipt-row]")].map((row) =>
        row.getAttribute("data-receipt-row")
      )
    ).toEqual(["result", "verdict", "file"]);
    expect(
      screen.getByRole("region", { name: "The receipt for cycle 20,744" })
    ).toBeInTheDocument();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() =>
      render(
        <Receipt
          cycle="1"
          locale="en-US"
          rows={[
            { id: "file", value: "x" },
            { id: "result", value: "y" },
          ]}
        />
      )
    ).toThrow(/fixed order/);
  });

  it("computes the file's SHA-256 in the browser and compares it with the index", async () => {
    Object.defineProperty(globalThis, "crypto", {
      value: webcrypto,
      configurable: true,
    });
    const text = fixtureDayText(20744) ?? "";
    const expected = book.text("tdh.latest.file.sha256");
    // The hash is a query, as on the page under the app's QueryClientProvider.
    const withQueries = (node: ReactNode) => (
      <QueryClientProvider client={new QueryClient()}>
        {node}
      </QueryClientProvider>
    );
    const { container } = render(
      withQueries(
        <BrowserHash text={text} expected={expected} locale="en-US" />
      )
    );
    await waitFor(() =>
      expect(container.querySelector("[data-browser-hash]")).toHaveAttribute(
        "data-browser-hash",
        "equal"
      )
    );
    expect(
      screen.getByText(
        "equals the index: your browser computed it from the 3,503 bytes of the file"
      )
    ).toBeInTheDocument();
    const other = render(
      withQueries(
        <BrowserHash text={`${text} `} expected={expected} locale="en-US" />
      )
    );
    await waitFor(() =>
      expect(
        other.container.querySelector("[data-browser-hash]")
      ).toHaveAttribute("data-browser-hash", "differs")
    );
  });
});

describe("agreement, the ladder and the failing case", () => {
  it("draws only the comparisons made, each as long as its share", () => {
    const { container } = render(
      <AgreementBars
        locale="en-US"
        pairs={[
          {
            who: "Rust core and 6529.io",
            sub: "identities",
            equal: book.get("tdh.latest.agree.live.identities.equal"),
            total: book.get("tdh.latest.agree.live.identities.total"),
            unit: "identities equal",
          },
        ]}
      />
    );
    expect(container.querySelector("[data-agree-share]")).toHaveAttribute(
      "data-agree-share",
      "1.0000"
    );
    const row = container.querySelector("[data-agree-share]");
    expect(row).toHaveTextContent("10,273 of 10,273");
    // Each count is printed through its fact, so it carries its source.
    expect(
      row?.querySelector('[data-fact="tdh.latest.agree.live.identities.equal"]')
    ).toHaveTextContent("10,273");
  });

  it("puts today's line after the rung the evidence reaches", () => {
    const { container } = render(
      <AssuranceLadder
        locale="en-US"
        tracks={[
          {
            rungs: [
              {
                what: "Written down",
                marks: [{ kind: "proposed", refText: "P26" }],
              },
              { what: "Recomputed daily", marks: [{ kind: "tested" }] },
              {
                what: "Proved in zero knowledge",
                marks: [{ halfPair: { a: true, b: false } }],
              },
            ],
            todayAfter: 2,
          },
        ]}
      />
    );
    const reached = [...container.querySelectorAll("[data-rung]")].map((rung) =>
      rung.getAttribute("data-reached")
    );
    expect(reached).toEqual(["1", "1", "0"]);
    expect(
      screen.getByText("Today the evidence reaches here")
    ).toBeInTheDocument();
  });

  it("turns the verdict and the ribbon together with one Break it", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SimulationSwitch id="failday">
        <WhenReal>
          <p>real verdict</p>
        </WhenReal>
        <WhenSimulated>
          <p>simulated verdict</p>
        </WhenSimulated>
        <SimulationButton
          id="fail"
          edge="Show a day that fails"
          back="Back to today"
        />
        <WhenReal>
          <p>real ribbon</p>
        </WhenReal>
        <WhenSimulated>
          <p>simulated ribbon</p>
        </WhenSimulated>
      </SimulationSwitch>
    );
    await user.click(
      screen.getByRole("button", { name: "Show a day that fails" })
    );
    expect(screen.getByText("simulated verdict")).toBeInTheDocument();
    expect(screen.getByText("simulated ribbon")).toBeInTheDocument();
    expect(screen.queryByText("real ribbon")).not.toBeInTheDocument();
    expect(container.querySelector('[data-lens="failday"]')).toHaveAttribute(
      "data-simulating",
      "1"
    );
    await user.click(screen.getByRole("button", { name: "Back to today" }));
    expect(screen.getByText("real verdict")).toBeInTheDocument();
  });
});

describe("Copy this page as Markdown", () => {
  it("keeps headings, prose, lists and tables, and leaves controls and hidden text out", () => {
    document.body.innerHTML = `
      <article>
        <h1>The daily check</h1>
        <p>Every day <b>two programs</b> run. <a href="/network/tdh">TDH</a></p>
        <ul><li>One</li><li>Two</li></ul>
        <button>Break it</button>
        <p aria-hidden="true">decoration</p>
        <span class="tw-sr-only">hidden</span>
        <table><tr><th>Program</th><th>Run</th></tr><tr><td>Rust core</td><td>8 min</td></tr></table>
      </article>`;
    const markdown = pageToMarkdown(
      document.querySelector("article") as Element,
      "https://6529.io/network/tdh/verification"
    );
    expect(markdown).toContain("# The daily check");
    expect(markdown).toContain(
      "Every day **two programs** run. [TDH](/network/tdh)"
    );
    expect(markdown).toContain("- One\n- Two");
    expect(markdown).toContain(
      "| Program | Run |\n| --- | --- |\n| Rust core | 8 min |"
    );
    expect(markdown).not.toContain("Break it");
    expect(markdown).not.toContain("decoration");
    expect(markdown).not.toContain("hidden");
    expect(markdown).toContain(
      "Source: https://6529.io/network/tdh/verification"
    );
  });
});
