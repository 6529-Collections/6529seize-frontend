import { fireEvent, render, screen } from "@testing-library/react";
import CreateWaveDropdown from "@/components/waves/create-wave/utils/CreateWaveDropdown";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";

jest.mock("@/hooks/useIsMobileLayoutViewport", () => ({
  __esModule: true,
  default: jest.fn(() => false),
}));

const options = [
  { value: "RANK", label: "Rank" },
  { value: "APPROVE", label: "Approve" },
] as const;

beforeEach(() => {
  jest.mocked(useIsMobileLayoutViewport).mockReturnValue(false);
});

it("does not open a disabled dropdown", () => {
  const onChange = jest.fn();
  render(
    <CreateWaveDropdown
      value="RANK"
      options={options}
      ariaLabel="Competition type"
      disabled
      onChange={onChange}
    />
  );
  const trigger = screen.getByRole("combobox", { name: "Competition type" });
  expect(trigger).toBeDisabled();
  fireEvent.click(trigger);
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  expect(onChange).not.toHaveBeenCalled();
});

it("closes choices when disabled and does not reopen on re-enable", () => {
  const onChange = jest.fn();
  const props = {
    value: "RANK",
    options,
    ariaLabel: "Competition type",
    onChange,
  };
  const view = render(<CreateWaveDropdown {...props} />);
  const trigger = screen.getByRole("combobox", { name: "Competition type" });
  fireEvent.click(trigger);
  expect(screen.getByRole("option", { name: "Approve" })).toBeInTheDocument();
  view.rerender(<CreateWaveDropdown {...props} disabled />);
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(onChange).not.toHaveBeenCalled();
  view.rerender(<CreateWaveDropdown {...props} />);
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  fireEvent.click(trigger);
  expect(screen.getByRole("listbox")).toBeInTheDocument();
});

it("keeps existing callers inline on mobile unless they opt into a sheet", () => {
  jest.mocked(useIsMobileLayoutViewport).mockReturnValue(true);
  const onChange = jest.fn();
  render(
    <CreateWaveDropdown
      value="RANK"
      options={options}
      ariaLabel="Existing field"
      onChange={onChange}
    />
  );
  fireEvent.click(screen.getByRole("combobox", { name: "Existing field" }));
  expect(screen.getByRole("listbox")).toHaveAttribute("data-placement");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("option", { name: "Approve" }));
  expect(onChange).toHaveBeenCalledWith("APPROVE");
});
