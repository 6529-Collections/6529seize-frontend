import { fireEvent, render, screen } from "@testing-library/react";
import MaxVotesPerIdentityInput from "@/components/waves/create-wave/voting/MaxVotesPerIdentityInput";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";

describe("MaxVotesPerIdentityInput", () => {
  it("shows the configured value", () => {
    render(
      <MaxVotesPerIdentityInput value={1} errors={[]} onChange={jest.fn()} />
    );

    expect(screen.getByLabelText("Vote cap per identity")).toHaveValue(1);
  });

  it("sends null when blank", () => {
    const onChange = jest.fn();
    render(
      <MaxVotesPerIdentityInput value={1} errors={[]} onChange={onChange} />
    );

    fireEvent.change(screen.getByLabelText("Vote cap per identity"), {
      target: { value: "" },
    });

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it.each([
    ["0", 0],
    ["-1", -1],
    ["1.5", 1.5],
  ])("sends invalid non-blank value %s to validation", (value, expected) => {
    const onChange = jest.fn();
    render(
      <MaxVotesPerIdentityInput value={1} errors={[]} onChange={onChange} />
    );

    fireEvent.change(screen.getByLabelText("Vote cap per identity"), {
      target: { value },
    });

    expect(onChange).toHaveBeenCalledWith(expected);
  });

  it("shows validation error text", () => {
    render(
      <MaxVotesPerIdentityInput
        value={null}
        errors={[
          CREATE_WAVE_VALIDATION_ERROR.MAX_VOTES_PER_IDENTITY_PER_DROP_INVALID,
        ]}
        onChange={jest.fn()}
      />
    );

    expect(
      screen.getByText("Enter a whole number greater than 0.")
    ).toBeInTheDocument();
  });
});
