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

    expect(screen.getByLabelText("Threshold")).toBeInTheDocument();
    expect(screen.getByDisplayValue("50")).toBeInTheDocument();
  });

  it("calls setThreshold with valid number on input change", () => {
    const setThreshold = jest.fn();
    render(
      <CreateWaveVotingThreshold
        {...defaultProps}
        setThreshold={setThreshold}
      />
    );

    fireEvent.change(screen.getByLabelText("Threshold"), {
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

    await userEvent.type(screen.getByLabelText("Threshold"), "abc");

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

    fireEvent.change(screen.getByLabelText("Threshold"), {
      target: { value: "75.5" },
    });

    expect(setThreshold).toHaveBeenCalledWith(null);
    expect(setThreshold).not.toHaveBeenCalledWith(75);
  });

  it("shows error message when error prop is true", () => {
    render(<CreateWaveVotingThreshold {...defaultProps} error={true} />);

    expect(screen.getByText("Please set threshold")).toBeInTheDocument();
    expect(screen.getByLabelText("Threshold")).toHaveClass("tw-ring-error");
  });
});
