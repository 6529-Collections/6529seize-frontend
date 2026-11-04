import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SingleWaveDropVoteInput } from "@/components/waves/drop/SingleWaveDropVoteInput";

function StatefulVoteInput({
  initialValue,
  minValue = 0,
  maxValue = 90_487_675,
  onValue = () => undefined,
}: {
  readonly initialValue: number | string;
  readonly minValue?: number;
  readonly maxValue?: number;
  readonly onValue?: (value: number | string) => void;
}) {
  const [voteValue, setVoteValue] = useState<number | string>(initialValue);
  return (
    <SingleWaveDropVoteInput
      voteValue={voteValue}
      minValue={minValue}
      maxValue={maxValue}
      label="TDH + XTDH"
      setVoteValue={(next) => {
        setVoteValue(next);
        onValue(typeof next === "function" ? next(voteValue) : next);
      }}
      onSubmit={() => undefined}
    />
  );
}

const getInput = () => screen.getByRole("textbox") as HTMLInputElement;

describe("SingleWaveDropVoteInput thousands separators", () => {
  it("shows the vote with thousands separators", () => {
    render(<StatefulVoteInput initialValue={5_000_000} />);

    expect(getInput()).toHaveValue("5,000,000");
  });

  it("shows negative votes with separators", () => {
    render(
      <StatefulVoteInput
        initialValue={-1234}
        minValue={-90_487_675}
        maxValue={90_487_675}
      />
    );

    expect(getInput()).toHaveValue("-1,234");
  });

  it("reads a value that already contains separators as the full number", () => {
    const onValue = jest.fn();
    render(<StatefulVoteInput initialValue="" onValue={onValue} />);

    fireEvent.change(getInput(), { target: { value: "5,000,000" } });

    expect(onValue).toHaveBeenLastCalledWith(5_000_000);
    expect(getInput()).toHaveValue("5,000,000");
  });

  it("adds separators as digits are typed", async () => {
    const user = userEvent.setup();
    const onValue = jest.fn();
    render(<StatefulVoteInput initialValue="" onValue={onValue} />);

    await user.type(getInput(), "5000000");

    expect(getInput()).toHaveValue("5,000,000");
    expect(onValue).toHaveBeenLastCalledWith(5_000_000);
  });

  it("keeps the caret after the typed digit when separators move", async () => {
    const user = userEvent.setup();
    render(<StatefulVoteInput initialValue={1234} />);
    const input = getInput();
    expect(input).toHaveValue("1,234");

    // Type 9 right after the first digit: 1|,234 -> 19,234
    await user.type(input, "9", {
      initialSelectionStart: 1,
      initialSelectionEnd: 1,
    });

    expect(input).toHaveValue("19,234");
    expect(input.selectionStart).toBe(2);
  });

  it("still allows an empty field and a lone minus sign while typing", () => {
    const onValue = jest.fn();
    render(
      <StatefulVoteInput
        initialValue={5}
        minValue={-100}
        maxValue={100}
        onValue={onValue}
      />
    );

    fireEvent.change(getInput(), { target: { value: "" } });
    expect(onValue).toHaveBeenLastCalledWith("");
    fireEvent.change(getInput(), { target: { value: "-" } });
    expect(onValue).toHaveBeenLastCalledWith("-");
    expect(getInput()).toHaveValue("-");
  });
});
