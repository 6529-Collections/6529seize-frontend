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
}: Partial<Pick<InputProps, "minMax" | "isProxy" | "variant">> & {
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
        inputId="test-rating"
      />
    </>
  );
}
const amount = () => screen.getByRole("textbox", { name: "Rating amount" });

it.each(["compact", "form"] as const)(
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

it("retains proxy typing without clamping on blur", async () => {
  const user = userEvent.setup();
  render(<Harness isProxy minMax={{ min: -1, max: 1 }} />);
  await user.clear(amount());
  await user.type(amount(), "12");
  await user.tab();
  expect(amount()).toHaveValue("12");
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
