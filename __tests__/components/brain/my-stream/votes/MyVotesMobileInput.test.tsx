import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { MyVotesMobileInput } from "@/components/brain/my-stream/votes/MyVotesMobileInput";

function Input({ failed = false }: { readonly failed?: boolean }) {
  const [value, setValue] = useState("13202");
  const [current, setCurrent] = useState(13202);
  const valid = /^-?\d+$/.test(value) && Math.abs(Number(value)) <= 20000;
  return (
    <MyVotesMobileInput
      id="vote"
      label="Your vote"
      value={value}
      currentVote={current}
      unit="TDH"
      min={-20000}
      valid={valid}
      busy={false}
      disabled={false}
      helperText="Enter a whole number between -20,000 and 20,000."
      error={failed ? "Please try again." : null}
      saveLabel="Save vote"
      explainLabel="Explain vote"
      explainDescription="Post a public reply about your saved vote."
      canExplain
      onChange={setValue}
      onSubmit={() => {
        if (!failed) setCurrent(Number(value));
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
  fireEvent.click(screen.getByRole("button", { name: "Save vote" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "Save vote" })
    ).not.toBeInTheDocument()
  );
});

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
