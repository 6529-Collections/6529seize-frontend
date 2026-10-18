import { render, screen } from "@testing-library/react";
import { HalfPair } from "@/components/explained/evidence/AssuranceLadder";
import DriftNote from "@/components/explained/marks/DriftNote";
import HashStripes, {
  stripeHues,
} from "@/components/explained/marks/HashStripes";
import Mark, {
  MARK_QUESTION,
  markWord,
  type MarkKind,
} from "@/components/explained/marks/Mark";
import StampLine from "@/components/explained/marks/StampLine";
import Tag from "@/components/explained/marks/Tag";
import Track from "@/components/explained/marks/Track";
import { SUPPORTED_LOCALES } from "@/i18n/locales";

const KINDS = Object.keys(MARK_QUESTION) as MarkKind[];

describe("the claim marks", () => {
  it("draws every mark as a glyph and a word, with no border", () => {
    for (const kind of KINDS) {
      const { container, unmount } = render(
        <Mark kind={kind} locale="en-US" />
      );
      const mark = container.querySelector(`[data-mark="${kind}"]`);
      expect(mark).not.toBeNull();
      expect(mark?.querySelector("svg[data-glyph]")).not.toBeNull();
      expect(mark?.textContent).toBe(markWord("en-US", kind));
      expect(mark?.className).not.toMatch(/tw-border/);
      unmount();
    }
  });

  it("has every mark's word in every locale", () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const kind of KINDS) {
        expect(markWord(locale, kind).length).toBeGreaterThan(1);
      }
    }
    expect(markWord("de-DE", "shownFalse")).toBe("Widerlegt");
  });

  it("keeps the mark's own word for screen readers when a label replaces it", () => {
    render(
      <Mark
        kind="tested"
        label="Recomputed daily"
        refText="equal on 5 of 5 days"
        locale="en-US"
      />
    );
    expect(screen.getByText("Recomputed daily")).toBeInTheDocument();
    expect(screen.getByText("Tested:", { exact: false })).toHaveClass(
      "tw-sr-only"
    );
    expect(screen.getByText("equal on 5 of 5 days")).toHaveClass(
      "tw-text-iron-400"
    );
  });

  it("never draws a decision in green", () => {
    for (const kind of ["decided", "absolute", "proposed", "open"] as const) {
      const { container, unmount } = render(
        <Mark kind={kind} locale="en-US" />
      );
      expect(container.innerHTML).not.toMatch(/3CCB7F/i);
      unmount();
    }
  });

  it("fills the track's segments by maturity, the live one blue", () => {
    const { container } = render(
      <Track
        maturity="live"
        locale="en-US"
        label="Live on 6529.io"
        refText="TDH v1.4"
      />
    );
    const segments = container.querySelectorAll("i");
    expect(segments).toHaveLength(3);
    expect(segments[2]).toHaveClass("tw-bg-primary-400");
    expect(screen.getByText("Live on 6529.io")).toBeInTheDocument();
    const built = render(
      <Track maturity="built" locale="en-US" />
    ).container.querySelectorAll("i");
    expect(built[1]).toHaveClass("tw-bg-iron-300");
    expect(built[2]).toHaveClass("tw-bg-iron-700");
  });

  it("allows at most three marks in one stamp line", () => {
    const marks = [
      { kind: "decided" as const },
      { maturity: "live" as const },
      { kind: "tested" as const },
    ];
    render(
      <StampLine
        marks={marks}
        tag={{ kind: "example", text: "Example copy" }}
        locale="en-US"
      />
    );
    expect(
      screen.getByRole("group", { name: "Status of this model" })
    ).toBeInTheDocument();
    expect(screen.getByText("Example copy")).toHaveAttribute(
      "data-tag",
      "example"
    );
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() =>
      render(
        <StampLine marks={[...marks, { kind: "proved" }]} locale="en-US" />
      )
    ).toThrow(/at most 3/);
  });

  it("marks a simulated tag rose and an example dotted", () => {
    render(
      <>
        <Tag kind="simulated" locale="en-US" />
        <Tag kind="example" locale="en-US" />
      </>
    );
    expect(screen.getByText("Simulated")).toHaveClass("tw-text-error");
    expect(screen.getByText("Example")).toHaveClass("tw-border-dotted");
  });

  it("draws sixteen stripes from a hash's first sixteen digits", () => {
    const { container } = render(<HashStripes hex="0x0123456789abcdef0123" />);
    expect(container.querySelectorAll("i")).toHaveLength(16);
    expect(stripeHues("0x0f")).toEqual([0, 338]);
  });

  it("names the newer decisions on a drift note", () => {
    const { container } = render(
      <DriftNote by={["D136", "D137"]} locale="en-US">
        The proofs are about the three-wallet rule.
      </DriftNote>
    );
    expect(container.querySelector("[data-drift-by]")).toHaveAttribute(
      "data-drift-by",
      "D136 D137"
    );
    expect(
      screen.getByLabelText("Newer decisions: D136 and D137")
    ).toBeInTheDocument();
  });

  it("names each half of a pair of proofs", () => {
    render(<HalfPair a b={false} locale="en-US" />);
    expect(
      screen.getByRole("img", { name: "Proof A: proved" })
    ).toHaveAttribute("data-proved", "1");
    expect(
      screen.getByRole("img", { name: "Proof B: not proved" })
    ).toHaveAttribute("data-proved", "0");
    expect(screen.getByText("Half a pair")).toBeInTheDocument();
  });
});
