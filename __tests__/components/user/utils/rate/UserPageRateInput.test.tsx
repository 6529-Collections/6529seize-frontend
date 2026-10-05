import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import UserPageRateInput from "@/components/user/utils/rate/UserPageRateInput";

function InputForm({ initialValue = "0", isProxy = false }) {
  const [value, setValue] = useState(initialValue);
  return (
    <form>
      <label htmlFor="rating">Total REP</label>
      <p id="limits">Available: 10</p>
      <UserPageRateInput
        value={value}
        onChange={setValue}
        minMax={{ min: -10, max: 10 }}
        isProxy={isProxy}
        inputId="rating"
        descriptionId="limits"
        required
      />
      <button type="submit">Save</button>
    </form>
  );
}

it("connects the rating label and available-credit description", () => {
  render(<InputForm />);
  expect(
    screen.getByRole("textbox", { name: "Total REP" })
  ).toHaveAccessibleDescription("Available: 10");
});

it.each(["", "0", "5", "-5", "10", "-10"])("allows editing %s", (value) => {
  render(<InputForm />);
  const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value } });
  expect(input).toHaveValue(value);
  expect(input).toHaveAttribute("aria-invalid", "false");
});

it.each(["abc", "1.5", "1e2", "--1"])(
  "rejects noninteger input %s",
  (value) => {
    render(<InputForm initialValue="5" />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value } });
    expect(screen.getByRole("textbox")).toHaveValue("5");
  }
);

it("allows a partial minus while editing but prevents form submission", () => {
  render(<InputForm />);
  const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value: "-" } });
  expect(input).toHaveValue("-");
  expect(input).toBeInvalid();
  expect(input).toHaveAttribute("aria-invalid", "true");
});

it.each([
  ["11", "10"],
  ["-11", "-10"],
])("shows invalid %s and clamps to %s on blur", (value, clamped) => {
  render(<InputForm initialValue={value} />);
  const input = screen.getByRole("textbox");
  expect(input).toHaveAttribute("aria-invalid", "true");
  fireEvent.blur(input);
  expect(input).toHaveValue(clamped);
  expect(input).toHaveAttribute("aria-invalid", "false");
});

it("preserves proxy amounts beyond the displayed limits on blur", () => {
  render(<InputForm initialValue="20" isProxy />);
  const input = screen.getByRole("textbox");
  expect(input).toHaveAttribute("aria-invalid", "false");
  fireEvent.blur(input);
  expect(input).toHaveValue("20");
});

it("keeps an empty required amount invalid without an immediate error border", () => {
  render(<InputForm initialValue="" />);
  expect(screen.getByRole("textbox")).toBeInvalid();
  expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "false");
});
