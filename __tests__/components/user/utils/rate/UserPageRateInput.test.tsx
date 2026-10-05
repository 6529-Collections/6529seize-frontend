import { useState, type ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageRateInput from "@/components/user/utils/rate/UserPageRateInput";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";

jest.mock("@/hooks/useBrowserLocale", () => ({ useBrowserLocale: jest.fn() }));
const localeMock = jest.mocked(useBrowserLocale);

type InputProps = ComponentProps<typeof UserPageRateInput>;
function Harness({
  initialValue = "0",
  minMax = { min: -2, max: 2 },
  isProxy = false,
  withStepper = true,
}: Partial<Pick<InputProps, "minMax" | "isProxy" | "withStepper">> & {
  readonly initialValue?: string;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <UserPageRateInput
      value={value}
      onChange={setValue}
      minMax={minMax}
      isProxy={isProxy}
      withStepper={withStepper}
      inputLabel="Rating amount"
    />
  );
}
const amount = () => screen.getByRole("textbox", { name: "Rating amount" });
const minus = () =>
  screen.getByRole("button", { name: "Decrease rating by 1" });
const plus = () => screen.getByRole("button", { name: "Increase rating by 1" });

beforeEach(() => localeMock.mockReturnValue("en-US"));

it("changes by one across zero and stops at both available limits", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await user.click(minus());
  expect(amount()).toHaveValue("-1");
  await user.click(minus());
  expect(amount()).toHaveValue("-2");
  expect(minus()).toBeDisabled();
  for (const expected of ["-1", "0", "1", "2"]) {
    await user.click(plus());
    expect(amount()).toHaveValue(expected);
  }
  expect(plus()).toBeDisabled();
});

it("supports keyboard stepping without submitting the surrounding form", async () => {
  const user = userEvent.setup();
  const submit = jest.fn((event) => event.preventDefault());
  render(
    <form onSubmit={submit}>
      <Harness />
    </form>
  );
  await user.tab();
  expect(minus()).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(amount()).toHaveValue("-1");
  await user.tab();
  expect(amount()).toHaveFocus();
  await user.tab();
  expect(plus()).toHaveFocus();
  await user.keyboard(" ");
  expect(amount()).toHaveValue("0");
  expect(submit).not.toHaveBeenCalled();
});

it("disables both buttons when no adjustment credit is available", () => {
  render(<Harness minMax={{ min: 0, max: 0 }} />);
  expect(minus()).toBeDisabled();
  expect(plus()).toBeDisabled();
});

it("updates button availability when limits change", () => {
  const { rerender } = render(<Harness />);
  expect(plus()).toBeEnabled();
  rerender(<Harness minMax={{ min: 0, max: 0 }} />);
  expect(minus()).toBeDisabled();
  expect(plus()).toBeDisabled();
});

it.each(["", "-"])(
  "can step from the unfinished value %j",
  async (initialValue) => {
    const user = userEvent.setup();
    render(<Harness initialValue={initialValue} />);
    await user.click(plus());
    expect(amount()).toHaveValue("1");
  }
);

it("uses the provided proxy limits for buttons while retaining proxy typing behavior", async () => {
  const user = userEvent.setup();
  render(<Harness isProxy minMax={{ min: -1, max: 1 }} />);
  await user.click(plus());
  expect(amount()).toHaveValue("1");
  expect(plus()).toBeDisabled();
  await user.clear(amount());
  await user.type(amount(), "12");
  await user.tab();
  expect(amount()).toHaveValue("12");
});

it("retains manual signed input and ordinary blur clamping", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await user.clear(amount());
  await user.type(amount(), "-12x");
  expect(amount()).toHaveValue("-12");
  await user.tab();
  expect(amount()).toHaveValue("-2");
});

it("keeps other shared-input consumers free of stepper actions", () => {
  render(<Harness withStepper={false} />);
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

it.each(["en-US", "en-GB", "fr-FR", "es-ES", "de-DE"] as const)(
  "provides accessible button names through the %s fallback",
  (locale) => {
    localeMock.mockReturnValue(locale);
    render(<Harness />);
    expect(minus()).toBeEnabled();
    expect(plus()).toBeEnabled();
  }
);
