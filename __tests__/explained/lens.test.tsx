import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BreakIt, { breakItLabel } from "@/components/explained/lens/BreakIt";
import Clock from "@/components/explained/lens/Clock";
import { Seg, Stepper } from "@/components/explained/lens/controls";
import Lens, { Readout } from "@/components/explained/lens/Lens";
import Predict from "@/components/explained/lens/Predict";
import { useBreakable } from "@/components/explained/lens/useBreakable";
import {
  World,
  decodeWorld,
  encodeWorld,
  useWorld,
} from "@/components/explained/lens/World";

function Machine() {
  const model = useBreakable({ days: 100, card: "2" }, (state) => ({
    ...state,
    days: 0,
  }));
  return (
    <Lens
      id="machine"
      label="One copy, as an area"
      question="What does one copy add?"
      broken={model.broken}
      locale="en-US"
      stage={
        <Seg
          label="Card"
          attr="card"
          value={model.state.card}
          onChange={(card) => model.set({ card })}
          options={[
            { value: "2", label: "#2" },
            { value: "4", label: "#4" },
          ]}
        />
      }
      rule={{
        lines: [{ text: "days = (T − a) div 86,400", on: true }],
        source: "P26 §4.3",
      }}
      readout={
        <Readout
          big={String(model.state.days)}
          unit="days"
          say={model.broken ? "Sold." : "Held."}
        />
      }
      breakIt={
        <BreakIt
          id="sell"
          pressed={model.broken}
          onToggle={model.toggleBreak}
          label={breakItLabel("en-US", "sell it")}
        />
      }
      stamp={<span>stamp</span>}
    />
  );
}

describe("the lens and Break it", () => {
  it("breaks the model to its edge and restores it on a second press", async () => {
    const user = userEvent.setup();
    const { container } = render(<Machine />);
    const lens = container.querySelector('[data-lens="machine"]');
    const button = screen.getByRole("button", { name: "Break it: sell it" });
    expect(button).toHaveAttribute("data-break", "sell");
    expect(button).toHaveAttribute("aria-pressed", "false");

    await user.click(screen.getByRole("button", { name: "#4" }));
    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(lens).toHaveAttribute("data-broken", "1");
    expect(lens).toHaveClass("tw-border-error/45");
    expect(screen.getByText("Sold.")).toBeInTheDocument();
    expect(screen.getAllByText("0")[0]).toBeInTheDocument();

    await user.click(button);
    expect(lens).toHaveAttribute("data-broken", "0");
    expect(screen.getByText("Held.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "#4" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("leaves the broken state when the reader changes an input", async () => {
    const user = userEvent.setup();
    const { container } = render(<Machine />);
    await user.click(screen.getByRole("button", { name: "Break it: sell it" }));
    await user.click(screen.getByRole("button", { name: "#4" }));
    expect(container.querySelector('[data-lens="machine"]')).toHaveAttribute(
      "data-broken",
      "0"
    );
  });

  it("reads the readout aloud and opens the exact rule behind one button on a phone", async () => {
    const user = userEvent.setup();
    const { container } = render(<Machine />);
    expect(
      container.querySelectorAll('[aria-live="polite"]').length
    ).toBeGreaterThanOrEqual(2);
    // Closed on a phone, the rail keeps the line in use and hides the rest.
    const rail = container.querySelector("[data-rule-rail]");
    expect(rail).not.toHaveClass("max-md:tw-hidden");
    // The machine's rule is all in use, so only its source waits behind
    // the button.
    const off = rail?.lastElementChild ?? null;
    expect(off).toHaveClass("max-md:tw-hidden");
    const toggle = screen.getByRole("button", { name: "The exact rule" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(off).not.toHaveClass("max-md:tw-hidden");
    expect(container.querySelector('[data-rule-on="1"]')).toHaveTextContent(
      "days = (T − a) div 86,400"
    );
  });

  it("steps within bounds, with labelled − and +", async () => {
    const user = userEvent.setup();
    function Count() {
      const model = useBreakable({ grads: 5 }, () => ({ grads: 6 }));
      return (
        <Stepper
          label="Gradients"
          value={model.state.grads}
          min={0}
          max={6}
          onChange={(grads) => model.set({ grads })}
          locale="en-US"
        />
      );
    }
    render(<Count />);
    const more = screen.getByRole("button", { name: "One more: Gradients" });
    await user.click(more);
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(more).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "One fewer: Gradients" })
    ).toBeEnabled();
  });

  it("asks a guess first and answers it", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Predict
        id="firstday"
        locale="en-US"
        question="which result counts its first whole day?"
        options={[
          { label: "Oct 18", right: false },
          { label: "Oct 19", right: true },
        ]}
        answer="The snapshot of Oct 19 finds a whole day."
      />
    );
    expect(container.querySelector("[data-predict]")).toHaveAttribute(
      "data-done",
      "0"
    );
    await user.click(screen.getByRole("button", { name: "Oct 18" }));
    expect(screen.getByText("Not quite.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Oct 19" }));
    expect(screen.getByText("Right.")).toBeInTheDocument();
    expect(
      screen.getByText("The snapshot of Oct 19 finds a whole day.")
    ).toBeInTheDocument();
  });
});

function CycleView() {
  const { state } = useWorld();
  return <p data-testid="view">{state.cycle}</p>;
}

describe("the world and its clock", () => {
  it("moves every linked view with one clock, by keys and by buttons", async () => {
    const user = userEvent.setup();
    render(
      <World initial={{ cycle: 20744 }}>
        <Clock id="tdh" min={20740} max={20744} locale="en-US" />
        <CycleView />
        <CycleView />
      </World>
    );
    const slider = screen.getByRole("slider", { name: "The day shown" });
    expect(slider).toHaveAttribute(
      "aria-valuetext",
      "The result dated October 18, 2026, cycle 20,744"
    );
    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(
      screen.getAllByTestId("view").map((view) => view.textContent)
    ).toEqual(["20743", "20743"]);
    fireEvent.keyDown(slider, { key: "Home" });
    expect(slider).toHaveAttribute("aria-valuenow", "20740");
    fireEvent.keyDown(slider, { key: "PageUp" });
    expect(slider).toHaveAttribute("aria-valuenow", "20744");
    await user.click(screen.getByRole("button", { name: "One day earlier" }));
    expect(slider).toHaveAttribute("aria-valuenow", "20743");
    expect(screen.getByRole("button", { name: "One day later" })).toBeEnabled();
  });

  it("shares a constructed world in the link, and never one that holds a real wallet", () => {
    const encoded = encodeWorld({ cycle: 20743, preset: "step1", note: "ü" });
    expect(decodeWorld(encoded)).toEqual({
      cycle: 20743,
      preset: "step1",
      note: "ü",
    });
    expect(decodeWorld("%%%")).toBeNull();

    window.history.replaceState(
      null,
      "",
      `/network/tdh?w=${encodeWorld({ cycle: 20741 })}`
    );
    const share = (state: { cycle: number; wallet?: unknown }) =>
      state.wallet ? null : { cycle: state.cycle };
    const parse = (value: unknown) =>
      value &&
      typeof value === "object" &&
      "cycle" in value &&
      typeof value.cycle === "number"
        ? { cycle: value.cycle }
        : null;
    // The page reads `?w=` from its search params and hands it down.
    const link = new URL(window.location.href).searchParams.get("w");
    const { unmount } = render(
      <World initial={{ cycle: 20744 }} share={share} parse={parse} link={link}>
        <CycleView />
      </World>
    );
    expect(screen.getByTestId("view")).toHaveTextContent("20741");
    expect(new URL(window.location.href).searchParams.get("w")).toBe(
      encodeWorld({ cycle: 20741 })
    );
    unmount();

    function WithWallet() {
      const { set } = useWorld();
      return (
        <button type="button" onClick={() => set({ wallet: "a real wallet" })}>
          add
        </button>
      );
    }
    render(
      <World initial={{ cycle: 20744 }} share={share} parse={parse}>
        <WithWallet />
      </World>
    );
    act(() => screen.getByRole("button", { name: "add" }).click());
    expect(new URL(window.location.href).searchParams.get("w")).toBeNull();
  });
});
