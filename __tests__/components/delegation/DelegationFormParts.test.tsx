import { render, fireEvent } from "@testing-library/react";
import {
  DelegationExpiryCalendar,
  DelegationTokenSelection,
  DelegationFormShell,
} from "@/components/delegation/DelegationFormParts";
import { EMPTY_DELEGATION_EXPIRY } from "@/components/delegation/delegation-expiry";

jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: (p: any) => (
    <svg data-testid="icon" onClick={p.onClick} {...p} />
  ),
}));

jest.mock("wagmi", () => ({ useEnsName: () => ({ data: null }) }));

describe("Delegation form helpers", () => {
  it("DelegationExpiryCalendar resolves the end of the local day", () => {
    const onChange = jest.fn();
    const { container } = render(
      <DelegationExpiryCalendar
        value={EMPTY_DELEGATION_EXPIRY}
        onChange={onChange}
      />
    );
    const input = container.querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "2024-01-02" } });
    // The runtime's local 23:59:59, whatever TZ the test process uses.
    expect(onChange).toHaveBeenCalledWith({
      date: "2024-01-02",
      expiresAt: new Date(2024, 0, 2, 23, 59, 59).getTime() / 1000,
    });
  });

  it("DelegationTokenSelection handles numeric input", () => {
    const setToken = jest.fn();
    const { container } = render(
      <DelegationTokenSelection setDelegationToken={setToken} />
    );
    const input = container.querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "5" } });
    expect(setToken).toHaveBeenCalledWith(5);
    fireEvent.change(input, { target: { value: "abc" } });
    expect(isNaN(setToken.mock.calls[1][0])).toBe(true);
  });

  it("DelegationCloseButton triggers onHide", () => {
    const onHide = jest.fn();
    const { getByLabelText } = render(
      <DelegationFormShell title="Test" onHide={onHide}>
        Content
      </DelegationFormShell>
    );
    fireEvent.click(getByLabelText("Cancel Test"));
    expect(onHide).toHaveBeenCalled();
  });

  it("DelegationFormOptionsFormGroup selects option", () => {
    const setSelected = jest.fn();
    const mod = require("@/components/delegation/DelegationFormParts");
    const { DelegationFormOptionsFormGroup } = mod;
    const { container } = render(
      <DelegationFormOptionsFormGroup
        title="T"
        tooltip="tip"
        options={["a", "b"]}
        selected=""
        setSelected={setSelected}
      />
    );
    const select = container.querySelector("select") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "b" } });
    expect(setSelected).toHaveBeenCalledWith("b");
  });

  it("DelegationFormLabel renders tooltip", () => {
    const mod = require("@/components/delegation/DelegationFormParts");
    const { DelegationFormLabel } = mod;
    const { getByRole, getByText } = render(
      <DelegationFormLabel title="Label" tooltip="info" />
    );
    expect(getByText("Label")).toBeInTheDocument();
    const tooltipButton = getByRole("button", { name: "info" });
    fireEvent.mouseEnter(tooltipButton);
    expect(getByRole("tooltip")).toHaveTextContent("info");
  });
});
