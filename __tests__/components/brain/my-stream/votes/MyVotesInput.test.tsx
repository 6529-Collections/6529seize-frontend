import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { MyVotesInput } from "@/components/brain/my-stream/votes/MyVotesInput";

function Input({
  failed = false,
  initial = 13202,
  busy = false,
  alwaysShowHelper = false,
  onSave,
}: {
  readonly failed?: boolean;
  readonly initial?: number;
  readonly busy?: boolean;
  readonly alwaysShowHelper?: boolean;
  readonly onSave?: () => void;
}) {
  const [value, setValue] = useState(String(initial));
  const [current, setCurrent] = useState(initial);
  const valid = /^-?\d+$/.test(value) && Math.abs(Number(value)) <= 20000;
  return (
    <MyVotesInput
      mobile={!alwaysShowHelper}
      alwaysShowHelper={alwaysShowHelper}
      id="vote"
      label="Your vote"
      value={value}
      currentVote={current}
      unit="TDH"
      min={-20000}
      valid={valid}
      busy={busy}
      disabled={false}
      helperText="Enter a whole number between -20,000 and 20,000."
      error={failed ? "Please try again." : null}
      saveLabel="Save vote"
      explainLabel="Explain vote"
      explainDescription="Post a public reply about your saved vote."
      canExplain
      onChange={setValue}
      onSubmit={() => {
        if (!failed) {
          setCurrent(Number(value));
          onSave?.();
        }
      }}
      onExplain={jest.fn()}
    />
  );
}

it("formats at rest, edits plain digits and only shows Save for a changed number", async () => {
  render(<Input />);
  const input = screen.getByRole("textbox", { name: "Your vote" });
  expect(input).toHaveValue("13,202");
  expect(input).toHaveAttribute("inputmode", "text");
  expect(
    screen.queryByRole("button", { name: "Save vote" })
  ).not.toBeInTheDocument();
  expect(screen.queryByText(/^Enter a whole number/)).not.toBeInTheDocument();
  fireEvent.focus(input);
  expect(input).toHaveValue("13202");
  expect(input).toHaveAccessibleDescription(
    "Enter a whole number between -20,000 and 20,000."
  );
  fireEvent.change(input, { target: { value: "14000" } });
  expect(screen.getByRole("button", { name: "Save vote" })).toBeEnabled();
  fireEvent.change(input, { target: { value: "13202" } });
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "Save vote" })
    ).not.toBeInTheDocument()
  );
  fireEvent.change(input, { target: { value: "-15000" } });
  fireEvent.blur(input);
  expect(input).toHaveValue("-15,000");
  const save = screen.getByRole("button", { name: "Save vote" });
  save.focus();
  fireEvent.click(save);
  expect(input).toHaveFocus();
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "Save vote" })
    ).not.toBeInTheDocument()
  );
});

it("keeps desktop range help visible before, during and after editing", () => {
  render(<Input alwaysShowHelper />);
  const input = screen.getByRole("textbox", { name: "Your vote" });
  const helper = screen.getByText(/^Enter a whole number/);
  expect(helper).toBeVisible();
  fireEvent.focus(input);
  expect(helper).toBeVisible();
  fireEvent.change(input, { target: { value: "14000" } });
  fireEvent.blur(input);
  expect(helper).toBeVisible();
  expect(input).toHaveAccessibleDescription(helper.textContent!);
});

it.each([
  { initial: 5, draft: "0005" },
  { initial: 0, draft: "-0" },
])(
  "treats normalized $draft as unchanged and blocks repeated submissions",
  async ({ initial, draft }) => {
    const save = jest.fn();
    const { rerender } = render(<Input initial={initial} onSave={save} />);
    const input = screen.getByRole("textbox", { name: "Your vote" });
    const form = input.closest("form")!;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: draft } });
    expect(
      screen.queryByRole("button", { name: "Save vote" })
    ).not.toBeInTheDocument();
    fireEvent.submit(form);
    expect(save).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "40" } });
    rerender(<Input initial={initial} onSave={save} busy />);
    fireEvent.submit(form);
    expect(save).not.toHaveBeenCalled();
    rerender(<Input initial={initial} onSave={save} />);
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(save).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Save vote" })
      ).not.toBeInTheDocument()
    );
  }
);

it("preserves a minus draft, rejects nonintegers and retains visible error help after blur", () => {
  render(<Input failed />);
  const input = screen.getByRole("textbox", { name: "Your vote" });
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: "-" } });
  expect(input).toHaveValue("-");
  fireEvent.change(input, { target: { value: "1.5" } });
  expect(input).toHaveValue("-");
  fireEvent.change(input, { target: { value: "21000" } });
  fireEvent.blur(input);
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByRole("button", { name: "Save vote" })).toBeDisabled();
  expect(screen.getByRole("alert")).toHaveTextContent("Please try again.");
  expect(screen.getByText(/^Enter a whole number/)).toBeVisible();
});
