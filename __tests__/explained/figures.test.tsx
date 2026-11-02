import { render, screen } from "@testing-library/react";
import AreaTile, { dayAxisFor } from "@/components/explained/figures/AreaTile";
import Convergence from "@/components/explained/figures/Convergence";
import EqualAreaFigure from "@/components/explained/figures/EqualAreaFigure";
import LoopFigure, {
  LoopLocator,
} from "@/components/explained/figures/LoopFigure";
import { Label, niceTicks, px } from "@/components/explained/figures/svg";
import WalletGraph from "@/components/explained/figures/WalletGraph";
import FactValue from "@/components/explained/facts/FactValue";
import { createFactBook } from "@/lib/explained/facts";
import { fixtureFactInputs } from "@/lib/explained/fixtureInputs";

/**
 * The figure primitives: text never under 12 px, labels from the engine's
 * numbers, the figure's claim as its accessible name, and states drawn the
 * way the design says (no area when sold, the dashed wallet alone).
 */
const book = createFactBook(fixtureFactInputs());

describe("figure primitives", () => {
  it("refuses figure text under 12 px", () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() =>
      render(
        <svg>
          <Label x={0} y={0} size={11}>
            small
          </Label>
        </svg>
      )
    ).toThrow(/12 px or more/);
    const { container } = render(
      <svg>
        <Label x={0} y={0}>
          ok
        </Label>
      </svg>
    );
    expect(container.querySelector("text")).toHaveAttribute("font-size", "12");
  });

  it("chooses round ticks and rounds coordinates for hydration", () => {
    expect(niceTicks(4000, 4)).toEqual([0, 1000, 2000, 3000, 4000]);
    expect(niceTicks(14, 4)).toEqual([0, 5, 10, 15]);
    expect(px(1.23456)).toBe(1.23);
  });

  it("draws one copy's TDH as an area, and no area once it is sold", () => {
    expect(dayAxisFor(100)).toBe(200);
    expect(dayAxisFor(500)).toBe(800);
    expect(dayAxisFor(5000)).toBe(1600);
    render(
      <AreaTile
        days={100}
        rateCents={394}
        betaCents={100}
        tdh={394}
        locale="en-US"
      />
    );
    expect(
      screen.getByRole("img", {
        name: "This copy's TDH drawn as an area: 100 whole days wide, rate 3.94 tall.",
      })
    ).toBeInTheDocument();
    expect(screen.getByText("394 TDH")).toBeInTheDocument();
    render(
      <AreaTile
        days={0}
        rateCents={394}
        betaCents={100}
        tdh={0}
        locale="en-US"
        hatchId="sold"
      />
    );
    expect(screen.getByText("0 days: no area")).toBeInTheDocument();
  });

  it("draws every edition to scale with the same area", () => {
    render(
      <EqualAreaFigure
        locale="en-US"
        items={[
          { name: "Meme #4", copies: 301, rateCents: 1309 },
          { name: "A 310-copy card", copies: 310, rateCents: 1271, you: true },
        ]}
      />
    );
    // both layouts are in the page; CSS shows one
    expect(screen.getAllByText("≈ 3,940 a day")).toHaveLength(4);
    expect(screen.getAllByText("301 copies × 13.09")).toHaveLength(2);
  });

  it("draws a wallet alone dashed, and names the groups", () => {
    const { container } = render(
      <WalletGraph
        locale="en-US"
        wallets={[
          { id: "A", x: 0.2, y: 0.2 },
          { id: "B", x: 0.8, y: 0.2 },
          { id: "C", x: 0.8, y: 0.8 },
        ]}
        links={[
          { a: "A", b: "B", kind: "old" },
          { a: "B", b: "C", kind: "old" },
        ]}
        groups={[["B", "C"]]}
      />
    );
    expect(container.querySelector("[data-fig]")).toHaveAttribute(
      "data-groups",
      "B + C; A alone"
    );
    expect(container.querySelector('[data-wallet="A"]')).toHaveAttribute(
      "data-alone",
      "1"
    );
    expect(container.querySelectorAll("[data-hull]")).toHaveLength(1);
  });

  it("marks where separately written programs agree, and names the one that leaves", () => {
    const { container } = render(
      <Convergence
        locale="en-US"
        programs={[
          { id: "a", label: "Rust core" },
          { id: "b", label: "Program B" },
        ]}
        rounds={[{ label: "Round 1", differs: ["b"] }, { label: "Round 2" }]}
      />
    );
    const horizontal = container.querySelector(
      '[data-layout="horizontal"]'
    ) as HTMLElement;
    expect(
      [...horizontal.querySelectorAll("[data-agree]")].map((knot) =>
        knot.getAttribute("data-agree")
      )
    ).toEqual(["0", "1"]);
    expect(screen.getAllByText("Program B differs")).toHaveLength(2);
    expect(container.querySelector('[data-layout="vertical"]')).not.toBeNull();
  });

  it("draws the loop with its live numbers and a locator for a chapter's eyebrow", () => {
    const stations = [
      "Art",
      "Hold",
      "Time",
      "Standing",
      "Decide",
      "Execute",
    ].map((name) => ({
      key: name.toLowerCase(),
      name,
      sub: "sub",
      num: `${name} number`,
    }));
    const { container } = render(
      <LoopFigure
        stations={stations}
        focus="time"
        verify={{ identities: "10,273" }}
        locale="en-US"
      />
    );
    const circle = container.querySelector(
      '[data-loop-layout="circle"]'
    ) as HTMLElement;
    expect(circle.querySelectorAll("[data-station]")).toHaveLength(6);
    expect(circle.querySelector('[data-focus="1"]')).toHaveAttribute(
      "data-station",
      "time"
    );
    expect(screen.getByText("equal on 10,273")).toBeInTheDocument();
    const list = container.querySelector(
      '[data-loop-layout="list"]'
    ) as HTMLElement;
    expect(list.querySelector('[aria-current="step"]')).toHaveAttribute(
      "data-station",
      "time"
    );
    render(<LoopLocator label="TDH on the loop" />);
    expect(
      screen.getByRole("img", { name: "TDH on the loop" })
    ).toBeInTheDocument();
  });

  it("prints a fact with its source, or says it is not available", () => {
    render(<FactValue fact={book.get("tdh.latest.total")} locale="en-US" />);
    const value = screen.getByText("2,082,190,981");
    expect(value).toHaveAttribute("data-fact", "tdh.latest.total");
    expect(value.getAttribute("title")).toMatch(
      /^Source: the public TDH feed, days\/20744\.json · written 00:49 UTC · read 09:40 UTC$/
    );
    render(<FactValue fact={book.maybe("manifest.sha256")} locale="en-US" />);
    expect(screen.getByText("not available")).toHaveAttribute(
      "data-fact-unavailable",
      ""
    );
  });
});
