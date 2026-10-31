import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WalletsLens from "@/app/network/tdh/consolidation/WalletsLens";
import FactsProvider from "@/components/explained/facts/FactsProvider";
import { createFactBook } from "@/lib/explained/facts";
import { fixtureFactInputs } from "@/lib/explained/fixtureInputs";

/**
 * The signing-order model (TDH-DESIGN.md §5.9) on its own: the engine's
 * groups drawn and read out, the exact rule with the gate's values, the
 * phone's rule button, and Break it restoring what the reader had.
 */
const book = createFactBook(fixtureFactInputs());

function renderLens(withRule: boolean) {
  return render(
    <FactsProvider snapshot={book.snapshot()}>
      <WalletsLens
        locale="en-US"
        start="missing"
        label="Four wallets, one identity"
        question="How do wallets become one identity?"
        withRule={withRule}
        caption="A dashed wallet counts alone."
        groups={[
          {
            label: "Cases",
            options: [
              { value: "three", label: "Three, all linked" },
              { value: "missing", label: "One pair missing" },
            ],
          },
          {
            label: "Adding a fourth wallet",
            lead: "Add D",
            options: [
              { value: "step1", label: "one link at a time: 1" },
              { value: "batch", label: "D signs last, one batch" },
            ],
          },
        ]}
      />
    </FactsProvider>
  );
}

describe("the signing-order model", () => {
  it("draws the engine's groups, a dashed wallet alone", async () => {
    const user = userEvent.setup();
    renderLens(true);
    const figure = screen.getByRole("img", {
      name: /Wallets and the identities/,
    });
    expect(figure).toHaveAccessibleName(
      "Wallets and the identities they form: B + C; A alone."
    );
    const lens = document.querySelector<HTMLElement>('[data-lens="wallets"]')!;
    expect(lens.querySelector('[data-wallet="A"]')).toHaveAttribute(
      "data-alone",
      "1"
    );
    await user.click(screen.getByRole("button", { name: "Three, all linked" }));
    expect(lens.querySelector("[data-readout-groups]")).toHaveTextContent(
      "A + B + C"
    );
    expect(lens).toHaveTextContent(
      "One identity: one TDH, one boost, one vote."
    );
    expect(
      screen.getByRole("button", { name: "Three, all linked" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "one link at a time: 1" })
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("prints the exact rule with the gate, and opens it on a phone", async () => {
    const user = userEvent.setup();
    renderLens(true);
    const rail = document.querySelector<HTMLElement>("[data-rule-rail]")!;
    expect(rail).toHaveTextContent(
      "past 3 only if one member links both ways with each other member, every link registered at or after 1,792,022,400"
    );
    expect(rail).toHaveTextContent("1,792,022,400 is Oct 15, 2026, 00:00 UTC.");
    const toggle = screen.getByRole("button", { name: "The exact rule" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("Break it links a fifth wallet, and restores the case the reader had", async () => {
    const user = userEvent.setup();
    renderLens(false);
    expect(document.querySelector("[data-rule-rail]")).toBeNull();
    await user.click(
      screen.getByRole("button", { name: "D signs last, one batch" })
    );
    const breakIt = screen.getByRole("button", {
      name: "Break it: link a fifth wallet",
    });
    await user.click(breakIt);
    const lens = document.querySelector<HTMLElement>('[data-lens="wallets"]')!;
    expect(lens).toHaveTextContent("Four at most. A counts on its own.");
    expect(breakIt).toHaveAttribute("aria-pressed", "true");
    await user.click(breakIt);
    expect(within(lens).getByText("A + B + C + D")).toBeInTheDocument();
  });
});
