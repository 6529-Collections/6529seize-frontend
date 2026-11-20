import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import NativeSelect from "@/components/utils/select/NativeSelect";
import DropdownToolbar from "@/components/utils/select/dropdown/DropdownToolbar";

describe("NativeSelect", () => {
  it("keeps native labels, changes, form data and the forwarded ref", () => {
    const ref = createRef<HTMLSelectElement>();
    const onChange = jest.fn();
    render(
      <form aria-label="Preferences">
        <label htmlFor="timeframe">Timeframe</label>
        <NativeSelect
          id="timeframe"
          name="timeframe"
          ref={ref}
          defaultValue="30"
          onChange={onChange}
        >
          <option value="30">30 days</option>
          <option value="90">90 days</option>
        </NativeSelect>
      </form>
    );
    const select = screen.getByRole("combobox", { name: "Timeframe" });
    fireEvent.change(select, { target: { value: "90" } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(ref.current).toBe(select);
    ref.current?.focus();
    expect(select).toHaveFocus();
    expect(
      new FormData(screen.getByRole<HTMLFormElement>("form")).get("timeframe")
    ).toBe("90");
    expect(select.nextElementSibling).toHaveAttribute("aria-hidden", "true");
  });

  it.each(["compact", "regular", "form"] as const)(
    "keeps disabled semantics and styling props out of the DOM (%s)",
    (variant) => {
      render(
        <NativeSelect
          aria-label="Unavailable"
          disabled
          variant={variant}
          metrics={{ height: 32, text: "xs" }}
          invalid
        >
          <option>Unavailable</option>
        </NativeSelect>
      );
      const select = screen.getByRole("combobox", { name: "Unavailable" });
      expect(select).toBeDisabled();
      for (const name of ["variant", "metrics", "invalid"])
        expect(select).not.toHaveAttribute(name);
    }
  );

  it("uses the toolbar height for a native select with the default form variant", () => {
    render(
      <DropdownToolbar variant="compact">
        <NativeSelect aria-label="Timeframe">
          <option>30 days</option>
        </NativeSelect>
      </DropdownToolbar>
    );
    const select = screen.getByRole("combobox", { name: "Timeframe" });
    expect(select).toHaveClass("tw-h-8", "tw-min-h-0");
    expect(select).not.toHaveClass("tw-min-h-11");
  });
});
