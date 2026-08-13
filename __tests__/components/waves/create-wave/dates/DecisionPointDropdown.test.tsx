import React from "react";
import { render, fireEvent } from "@testing-library/react";
import DecisionPointDropdown from "@/components/waves/create-wave/dates/DecisionPointDropdown";
import { Period } from "@/helpers/Types";

describe("DecisionPointDropdown", () => {
  it("selects option and closes menu", () => {
    const onChange = jest.fn();
    const { getByRole, queryByText } = render(
      <DecisionPointDropdown value={Period.DAYS} onChange={onChange} />
    );
    fireEvent.click(getByRole("combobox"));
    expect(queryByText("Hours")).not.toBeNull(); // Hours option should be visible in open dropdown
    fireEvent.click(getByRole("option", { name: "Hours" }));
    expect(onChange).toHaveBeenCalledWith(Period.HOURS);
    expect(queryByText("Hours")).toBeNull(); // Hours option should no longer be visible after dropdown closes
  });

  it("handles Escape locally without bubbling to the modal", () => {
    const onParentKeyDown = jest.fn();
    const { getByRole } = render(
      <div onKeyDown={onParentKeyDown}>
        <DecisionPointDropdown value={Period.DAYS} onChange={jest.fn()} />
      </div>
    );
    const trigger = getByRole("combobox");

    fireEvent.click(trigger);
    fireEvent.keyDown(getByRole("option", { name: "Hours" }), {
      key: "Escape",
    });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
    expect(onParentKeyDown).not.toHaveBeenCalled();
  });
});
