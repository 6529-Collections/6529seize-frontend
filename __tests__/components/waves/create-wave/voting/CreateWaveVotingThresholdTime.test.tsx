import { fireEvent, render, screen } from "@testing-library/react";
import CreateWaveVotingThresholdTime from "@/components/waves/create-wave/voting/CreateWaveVotingThresholdTime";

describe("CreateWaveVotingThresholdTime", () => {
  const defaultProps = {
    thresholdTimeMs: null,
    setThresholdTimeMs: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the current duration", () => {
    render(
      <CreateWaveVotingThresholdTime
        {...defaultProps}
        thresholdTimeMs={7_200_000}
      />
    );

    expect(
      screen.getByLabelText("Minimum time above threshold")
    ).toHaveValue("2");
    expect(
      screen.getByLabelText("Minimum time above threshold unit")
    ).toHaveValue("hours");
  });

  it("stores hours as milliseconds", () => {
    const setThresholdTimeMs = jest.fn();

    render(
      <CreateWaveVotingThresholdTime
        {...defaultProps}
        setThresholdTimeMs={setThresholdTimeMs}
      />
    );

    fireEvent.change(
      screen.getByLabelText("Minimum time above threshold unit"),
      {
        target: { value: "hours" },
      }
    );
    fireEvent.change(screen.getByLabelText("Minimum time above threshold"), {
      target: { value: "2" },
    });

    expect(setThresholdTimeMs).toHaveBeenLastCalledWith(7_200_000);
  });

  it("keeps the field editable when input is cleared", () => {
    const setThresholdTimeMs = jest.fn();

    render(
      <CreateWaveVotingThresholdTime
        {...defaultProps}
        thresholdTimeMs={120_000}
        setThresholdTimeMs={setThresholdTimeMs}
      />
    );

    fireEvent.change(screen.getByLabelText("Minimum time above threshold"), {
      target: { value: "" },
    });

    expect(screen.getByLabelText("Minimum time above threshold")).toHaveValue(
      ""
    );
    expect(setThresholdTimeMs).toHaveBeenCalledWith(null);
  });

  it("stores a replacement value after the input is cleared", () => {
    const setThresholdTimeMs = jest.fn();

    render(
      <CreateWaveVotingThresholdTime
        {...defaultProps}
        thresholdTimeMs={120_000}
        setThresholdTimeMs={setThresholdTimeMs}
      />
    );

    fireEvent.change(screen.getByLabelText("Minimum time above threshold"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByLabelText("Minimum time above threshold"), {
      target: { value: "3" },
    });

    expect(setThresholdTimeMs).toHaveBeenNthCalledWith(1, null);
    expect(setThresholdTimeMs).toHaveBeenLastCalledWith(180_000);
  });

  it("stores an invalid draft value for invalid input", () => {
    const setThresholdTimeMs = jest.fn();

    render(
      <CreateWaveVotingThresholdTime
        {...defaultProps}
        thresholdTimeMs={120_000}
        setThresholdTimeMs={setThresholdTimeMs}
      />
    );

    fireEvent.change(screen.getByLabelText("Minimum time above threshold"), {
      target: { value: "1.5" },
    });

    expect(screen.getByLabelText("Minimum time above threshold")).toHaveValue(
      "1.5"
    );
    expect(setThresholdTimeMs).toHaveBeenCalledWith(0);
  });

  it("shows the provided error message", () => {
    render(
      <CreateWaveVotingThresholdTime
        {...defaultProps}
        errorMessage="Enter a whole number greater than 0, or leave blank for immediate approval."
      />
    );

    const input = screen.getByLabelText("Minimum time above threshold");

    expect(
      screen.getByText(
        "Enter a whole number greater than 0, or leave blank for immediate approval."
      )
    ).toBeInTheDocument();
    expect(input).toHaveClass("tw-ring-error");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute(
      "aria-describedby",
      "approval-threshold-time-error approval-threshold-time-help"
    );
  });
});
