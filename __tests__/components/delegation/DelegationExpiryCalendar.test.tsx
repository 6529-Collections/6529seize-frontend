import { DelegationExpiryCalendar } from "@/components/delegation/DelegationFormParts";
import {
  EMPTY_DELEGATION_EXPIRY,
  type DelegationExpirySelection,
} from "@/components/delegation/delegation-expiry";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

jest.mock("@/components/delegation/delegation-expiry", () => ({
  ...jest.requireActual("@/components/delegation/delegation-expiry"),
  getViewerTimeZone: () => "America/Los_Angeles",
}));

jest.mock("wagmi", () => ({
  useWaitForTransactionReceipt: jest.fn(),
  useWriteContract: jest.fn(),
}));

const normalizeSpaces = (value: string | null) =>
  (value ?? "").replace(/\s/g, " ");

function ControlledCalendar(
  props: Readonly<{ onChange?: (value: DelegationExpirySelection) => void }>
) {
  const [value, setValue] = useState(EMPTY_DELEGATION_EXPIRY);
  return (
    <DelegationExpiryCalendar
      value={value}
      onChange={(next) => {
        setValue(next);
        props.onChange?.(next);
      }}
    />
  );
}

describe("DelegationExpiryCalendar", () => {
  let nowSpy: jest.SpyInstance<number, []>;

  beforeEach(() => {
    // 12:00 PDT on 14 October 2026 (19:00 UTC).
    nowSpy = jest
      .spyOn(Date, "now")
      .mockReturnValue(Date.parse("2026-10-14T19:00:00Z"));
  });

  afterEach(() => {
    nowSpy.mockRestore();
  });

  it("limits the picker to dates that end at least an hour from now", () => {
    render(<ControlledCalendar />);
    expect(screen.getByLabelText("Expiry Date")).toHaveAttribute(
      "min",
      "2026-10-14"
    );
  });

  it("names the zone and previews the exact instant before signing", () => {
    const onChange = jest.fn();
    render(<ControlledCalendar onChange={onChange} />);
    const input = screen.getByLabelText("Expiry Date");

    expect(input).toHaveAccessibleDescription(
      "The delegation ends at the end of the selected day in your time zone (America/Los_Angeles). Select a date to see the exact expiry time."
    );

    fireEvent.change(input, { target: { value: "2026-10-14" } });

    expect(onChange).toHaveBeenLastCalledWith({
      date: "2026-10-14",
      expiresAt: Date.parse("2026-10-15T06:59:59Z") / 1000,
    });
    expect(input).toHaveValue("2026-10-14");
    const preview = screen.getByText(/^Expires /);
    expect(preview).toHaveAttribute("aria-live", "polite");
    expect(normalizeSpaces(preview.textContent)).toBe(
      "Expires Oct 14, 2026, 11:59 PM PDT (Oct 15, 2026, 06:59 UTC)"
    );
    expect(normalizeSpaces(input.getAttribute("aria-describedby"))).toContain(
      preview.id
    );
  });

  it("clears the resolved expiry when the date is removed", () => {
    const onChange = jest.fn();
    render(<ControlledCalendar onChange={onChange} />);
    const input = screen.getByLabelText("Expiry Date");

    fireEvent.change(input, { target: { value: "2026-10-20" } });
    fireEvent.change(input, { target: { value: "" } });

    expect(onChange).toHaveBeenLastCalledWith(EMPTY_DELEGATION_EXPIRY);
    expect(
      screen.getByText("Select a date to see the exact expiry time.")
    ).toBeInTheDocument();
  });
});
