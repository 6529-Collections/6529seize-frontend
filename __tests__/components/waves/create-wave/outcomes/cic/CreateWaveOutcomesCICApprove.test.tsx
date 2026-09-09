import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveOutcomesCICApprove from "@/components/waves/create-wave/outcomes/cic/CreateWaveOutcomesCICApprove";

describe("CreateWaveOutcomesCICApprove", () => {
  const defaultProps = {
    onOutcome: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders NIC input without max winners input", () => {
    render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

    expect(screen.getByLabelText("NIC")).toBeInTheDocument();
    expect(screen.queryByLabelText("Max Winners")).not.toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("updates NIC value on numeric input", async () => {
    const user = userEvent.setup();
    render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

    const nicInput = screen.getByLabelText("NIC");
    await user.type(nicInput, "100");

    expect(nicInput).toHaveValue("100");
  });

  it("handles decimal values and submit correctly", async () => {
    const user = userEvent.setup();
    render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

    const nicInput = screen.getByLabelText("NIC");
    fireEvent.change(nicInput, { target: { value: "50.5" } });

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(defaultProps.onOutcome).toHaveBeenCalledWith(
      expect.objectContaining({ credit: 50.5 })
    );
  });

  it("clears value on invalid input", async () => {
    const user = userEvent.setup();
    render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

    const nicInput = screen.getByLabelText("NIC");

    await user.type(nicInput, "100");
    expect(nicInput).toHaveValue("100");

    await user.clear(nicInput);
    await user.type(nicInput, "invalid");

    expect(nicInput).toHaveValue("");
  });

  it("handles negative input by ignoring minus sign", async () => {
    const user = userEvent.setup();
    render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

    const nicInput = screen.getByLabelText("NIC");
    await user.type(nicInput, "-10");

    expect(nicInput).toHaveValue("10");
  });

  it("shows zero in the input but rejects it on submit", async () => {
    const user = userEvent.setup();
    render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

    const nicInput = screen.getByLabelText("NIC");
    await user.type(nicInput, "0");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(nicInput).toHaveValue("0");
    expect(
      screen.getByText("NIC must be a positive number")
    ).toBeInTheDocument();
    expect(defaultProps.onOutcome).not.toHaveBeenCalled();
  });

  it("rejects non-finite NIC amounts", async () => {
    const user = userEvent.setup();
    render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

    fireEvent.change(screen.getByLabelText("NIC"), {
      target: { value: "Infinity" },
    });
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      screen.getByText("NIC must be a positive number")
    ).toBeInTheDocument();
    expect(defaultProps.onOutcome).not.toHaveBeenCalled();
  });

  it("clears error when valid input is entered", async () => {
    const user = userEvent.setup();
    render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(
      screen.getByText("NIC must be a positive number")
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("NIC"), "50");

    expect(
      screen.queryByText("NIC must be a positive number")
    ).not.toBeInTheDocument();
  });

  it("shows error when submitting without NIC value", async () => {
    const user = userEvent.setup();
    render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      screen.getByText("NIC must be a positive number")
    ).toBeInTheDocument();
    expect(defaultProps.onOutcome).not.toHaveBeenCalled();
  });

  it("submits successfully with valid NIC value", async () => {
    const user = userEvent.setup();
    render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

    const nicInput = screen.getByLabelText("NIC");
    await user.type(nicInput, "100");

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(defaultProps.onOutcome).toHaveBeenCalledWith({
      type: "NIC",
      title: null,
      credit: 100,
      category: null,
      winnersConfig: null,
    });
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

    await user.click(screen.getByText("Cancel"));

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it("applies error styling when error is present", async () => {
    const user = userEvent.setup();
    render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    const nicInput = screen.getByLabelText("NIC");
    expect(nicInput).toHaveClass("tw-ring-error");
    expect(nicInput).toHaveClass("focus:tw-border-error");
    expect(nicInput).toHaveClass("focus:tw-ring-error");
    expect(nicInput).toHaveClass("tw-caret-error");
  });

  it("uses the shared medium primary button", () => {
    render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

    const primaryButton = screen.getByRole("button", { name: "Save" });

    expect(primaryButton).not.toHaveAttribute("aria-busy");
    expect(primaryButton).not.toBeDisabled();
    expect(primaryButton).toHaveClass("tw-h-10", "tw-px-3.5", "tw-text-sm");
  });

  it("applies normal styling when no error is present", () => {
    render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

    const nicInput = screen.getByLabelText("NIC");
    expect(nicInput).toHaveClass("tw-ring-white/5");
    expect(nicInput).toHaveClass("focus:tw-border-primary-500/50");
    expect(nicInput).toHaveClass("focus:tw-ring-primary-400");
    expect(nicInput).toHaveClass("tw-caret-primary-400");
  });

  it("handles paste events", () => {
    render(<CreateWaveOutcomesCICApprove {...defaultProps} />);

    const nicInput = screen.getByLabelText("NIC");
    fireEvent.change(nicInput, { target: { value: "123.45" } });

    expect(nicInput).toHaveValue("123.45");
  });
});
