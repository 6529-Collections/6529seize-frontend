import { VoteRationaleControl } from "@/components/voting/VoteRationaleControl";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

function VoteRationaleHarness() {
  const [checked, setChecked] = useState(false);
  const [value, setValue] = useState("Generated vote prefix\n\n");

  return (
    <VoteRationaleControl
      checked={checked}
      onCheckedChange={setChecked}
      value={value}
      onChange={setValue}
      generated={false}
      invalid={false}
    />
  );
}

describe("VoteRationaleControl", () => {
  it("opens with the keyboard and retains the controlled reply across toggles", async () => {
    const user = userEvent.setup();
    render(<VoteRationaleHarness />);

    const control = screen.getByRole("switch", { name: "Explain vote" });
    const panelId = control.getAttribute("aria-controls");
    if (!panelId) throw new Error("Reply panel reference is missing");
    const panel = document.getElementById(panelId);
    const retainedField = panel?.querySelector("textarea");
    expect(retainedField).toHaveValue("Generated vote prefix\n\n");
    expect(panel).toHaveAttribute("inert");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    await user.tab();
    expect(control).toHaveFocus();
    await user.keyboard(" ");

    const field = screen.getByRole("textbox", {
      name: "Optional rationale reply",
    });
    expect(control).toBeChecked();
    expect(panel).not.toHaveAttribute("inert");
    await user.type(field, "Reason");
    await user.click(control);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(panel?.querySelector("textarea")).toBe(retainedField);
    await user.click(control);
    expect(field).toHaveValue("Generated vote prefix\n\nReason");
  });

  it("associates empty-reply validation and public-reply guidance with both controls", () => {
    render(
      <VoteRationaleControl
        checked
        onCheckedChange={jest.fn()}
        value=""
        onChange={jest.fn()}
        generated={false}
        invalid
      />
    );

    const control = screen.getByRole("switch", { name: "Explain vote" });
    const field = screen.getByRole("textbox", {
      name: "Optional rationale reply",
    });
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Add rationale text or turn Explain vote off."
    );
    for (const element of [control, field]) {
      expect(element).toHaveAccessibleDescription(
        /Posts a public reply in the wave after your vote is saved/
      );
      expect(element).toHaveAccessibleDescription(
        /Add rationale text or turn Explain vote off/
      );
    }
  });

  it("renders the caller's value and placeholder without changing generated or custom text", () => {
    const onChange = jest.fn();
    render(
      <VoteRationaleControl
        checked
        onCheckedChange={jest.fn()}
        value={"Generated vote prefix\n\n"}
        onChange={onChange}
        generated
        invalid={false}
        placeholder="Vote summary placeholder"
        compact
      />
    );

    const field = screen.getByRole("textbox", {
      name: "Optional rationale reply",
    });
    expect(field).toHaveValue("Generated vote prefix\n\n");
    expect(field).toHaveAttribute("placeholder", "Vote summary placeholder");
    fireEvent.change(field, { target: { value: "  Custom\nreply  " } });
    expect(onChange).toHaveBeenCalledWith("  Custom\nreply  ");
  });
});
