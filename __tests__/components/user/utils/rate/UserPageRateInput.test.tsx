import { useState, type ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageRateInput from "@/components/user/utils/rate/UserPageRateInput";

type InputProps = ComponentProps<typeof UserPageRateInput>;
function Harness({
  initialValue = "0",
  minMax = { min: -2, max: 2 },
  isProxy = false,
  variant = "form",
  clampOnBlur = true,
}: Partial<
  Pick<InputProps, "minMax" | "isProxy" | "variant" | "clampOnBlur">
> & {
  readonly initialValue?: string;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <>
      <label htmlFor="test-rating">Rating amount</label>
      <UserPageRateInput
        value={value}
        onChange={setValue}
        minMax={minMax}
        isProxy={isProxy}
        variant={variant}
        clampOnBlur={clampOnBlur}
        inputId="test-rating"
      />
      <output data-testid="raw-rating">{value}</output>
    </>
  );
}
const amount = () => screen.getByRole("textbox", { name: "Rating amount" });

it.each(["compact", "form", "tooltip"] as const)(
  "keeps the %s signs informational and out of the tab order",
  async (variant) => {
    const user = userEvent.setup();
    render(
      <>
        <Harness variant={variant} />
        <button type="button">Next control</button>
      </>
    );
    expect(screen.getAllByRole("button")).toHaveLength(1);
    await user.tab();
    expect(amount()).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Next control" })).toHaveFocus();
    expect(amount()).toHaveValue("0");
  }
);

it.each([12345, -12345])(
  "groups %s only while idle and keeps the raw draft unchanged",
  async (value) => {
    const user = userEvent.setup();
    render(
      <Harness
        initialValue={String(value)}
        minMax={{ min: -20000, max: 20000 }}
      />
    );
    const grouped = value < 0 ? "-12,345" : "12,345";
    expect(amount()).toHaveValue(grouped);
    await user.click(amount());
    expect(amount()).toHaveValue(String(value));
    await user.tab();
    expect(amount()).toHaveValue(grouped);
    expect(screen.getByTestId("raw-rating")).toHaveTextContent(String(value));
  }
);

it("formats a clamped amount without sending grouping separators to the draft", async () => {
  const user = userEvent.setup();
  render(<Harness minMax={{ min: -10000, max: 10000 }} />);
  await user.clear(amount());
  await user.type(amount(), "20000");
  expect(amount()).toHaveValue("20000");
  await user.tab();
  expect(amount()).toHaveValue("10,000");
  expect(screen.getByTestId("raw-rating")).toHaveTextContent("10000");
});

it.each(["-", "9007199254740993"])(
  "does not round or replace the draft %s",
  async (value) => {
    const user = userEvent.setup();
    render(<Harness isProxy initialValue={value} />);
    expect(amount()).toHaveValue(value);
    await user.click(amount());
    await user.tab();
    expect(amount()).toHaveValue(value);
    expect(screen.getByTestId("raw-rating")).toHaveTextContent(value);
  }
);

it("retains proxy typing without clamping on blur", async () => {
  const user = userEvent.setup();
  render(<Harness isProxy minMax={{ min: -1, max: 1 }} />);
  await user.clear(amount());
  await user.type(amount(), "12");
  await user.tab();
  expect(amount()).toHaveValue("12");
});

it("keeps a draft on blur until its bounds are available", async () => {
  const user = userEvent.setup();
  const { rerender } = render(
    <Harness clampOnBlur={false} minMax={{ min: 0, max: 0 }} />
  );
  await user.clear(amount());
  await user.type(amount(), "12");
  await user.tab();
  expect(amount()).toHaveValue("12");

  rerender(<Harness minMax={{ min: -10, max: 10 }} />);
  expect(amount()).toHaveValue("12");
  await user.click(amount());
  await user.tab();
  expect(amount()).toHaveValue("10");
});

it.each([
  ["-12x", "-12", "-2"],
  ["12x", "12", "2"],
])(
  "retains integer entry and blur clamping for %s",
  async (typed, entered, clamped) => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.clear(amount());
    await user.type(amount(), typed);
    expect(amount()).toHaveValue(entered);
    await user.tab();
    expect(amount()).toHaveValue(clamped);
  }
);
