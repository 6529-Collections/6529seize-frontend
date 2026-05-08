import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveVotingThreshold from "@/components/waves/create-wave/voting/CreateWaveVotingThreshold";

describe("CreateWaveVotingThreshold", () => {
  const defaultProps = {
    threshold: null,
    error: false,
    setThreshold: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders threshold input with current value", () => {
    render(<CreateWaveVotingThreshold {...defaultProps} threshold={50} />);

    expect(screen.getByLabelText("Approval threshold")).toBeInTheDocument();
    expect(screen.getByDisplayValue("50")).toBeInTheDocument();
    expect(
      screen.getByText(
        "A drop is approved when its vote score reaches this number. Example: 50 means the drop needs a score of 50 to win."
      )
    ).toBeInTheDocument();
  });

  it("calls setThreshold with valid number on input change", () => {
    const setThreshold = jest.fn();
    render(
      <CreateWaveVotingThreshold
        {...defaultProps}
        setThreshold={setThreshold}
      />
    );

    fireEvent.change(screen.getByLabelText("Approval threshold"), {
      target: { value: "75" },
    });

    expect(setThreshold).toHaveBeenCalledWith(75);
  });

  it("calls setThreshold with null for invalid input", async () => {
    const setThreshold = jest.fn();
    render(
      <CreateWaveVotingThreshold
        {...defaultProps}
        setThreshold={setThreshold}
      />
    );

    await userEvent.type(screen.getByLabelText("Approval threshold"), "abc");

    expect(setThreshold).toHaveBeenCalledWith(null);
  });

  it("rejects decimal threshold instead of truncating", () => {
    const setThreshold = jest.fn();
    render(
      <CreateWaveVotingThreshold
        {...defaultProps}
        setThreshold={setThreshold}
      />
    );

    fireEvent.change(screen.getByLabelText("Approval threshold"), {
      target: { value: "75.5" },
    });

    expect(setThreshold).toHaveBeenCalledWith(null);
    expect(setThreshold).not.toHaveBeenCalledWith(75);
  });

  it("shows error message when error prop is true", () => {
    render(<CreateWaveVotingThreshold {...defaultProps} error={true} />);

    const input = screen.getByLabelText("Approval threshold");

    expect(
      screen.getByText("Enter an approval threshold greater than 0.")
    ).toBeInTheDocument();
    expect(input).toHaveClass("tw-ring-error");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute(
      "aria-describedby",
      "approval-threshold-error approval-threshold-help"
    );
  });
});
