import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveOutcomesManual from "@/components/waves/create-wave/outcomes/manual/CreateWaveOutcomesManual";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

jest.mock("@/components/utils/button/PrimaryButton", () => {
  return function MockPrimaryButton({
    children,
    onClicked,
    disabled,
    loading,
  }: any) {
    return (
      <button
        data-testid="primary-button"
        onClick={onClicked}
        disabled={disabled || loading}
      >
        {children}
      </button>
    );
  };
});

describe("CreateWaveOutcomesManual", () => {
  const defaultProps = {
    waveType: ApiWaveType.Approve,
    onOutcome: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("explains what a manual outcome is and where its text appears", () => {
    render(<CreateWaveOutcomesManual {...defaultProps} />);

    expect(screen.getByLabelText("What winners receive")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Add a custom reward or result you will fulfill for approved winners."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/this text appears in the wave’s Outcome tab/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Signed print shipped by the creator/i)
    ).toBeInTheDocument();
  });

  it("shows positions input for rank wave type", () => {
    render(
      <CreateWaveOutcomesManual {...defaultProps} waveType={ApiWaveType.Rank} />
    );

    expect(screen.getByLabelText("Winning ranks")).toBeInTheDocument();
    expect(
      screen.getByText(/Every listed rank receives this same outcome/i)
    ).toBeInTheDocument();
  });

  it("does not show max winners input", () => {
    render(<CreateWaveOutcomesManual {...defaultProps} />);

    expect(screen.queryByLabelText("Max Winners")).not.toBeInTheDocument();
  });

  it("does not show positions for approve wave type", () => {
    render(
      <CreateWaveOutcomesManual
        {...defaultProps}
        waveType={ApiWaveType.Approve}
      />
    );

    expect(screen.queryByLabelText("Winning ranks")).not.toBeInTheDocument();
  });

  it("updates manual action value on input change", async () => {
    render(<CreateWaveOutcomesManual {...defaultProps} />);

    const input = screen.getByLabelText("What winners receive");
    await userEvent.type(input, "Test action");

    expect(input).toHaveValue("Test action");
  });

  it("shows error when submitting without manual action", async () => {
    render(<CreateWaveOutcomesManual {...defaultProps} />);

    const saveButton = screen.getByTestId("primary-button");
    await userEvent.click(saveButton);

    expect(
      screen.getByText("Describe what winners receive.")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("What winners receive")).toHaveFocus();
  });

  it("shows error for rank wave without positions", async () => {
    render(
      <CreateWaveOutcomesManual {...defaultProps} waveType={ApiWaveType.Rank} />
    );

    const actionInput = screen.getByLabelText("What winners receive");
    await userEvent.type(actionInput, "Test action");

    const saveButton = screen.getByTestId("primary-button");
    await userEvent.click(saveButton);

    expect(
      screen.getByText("Enter at least one winning rank.")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Winning ranks")).toHaveFocus();
  });

  it("accepts valid position format for rank wave", async () => {
    const mockOnOutcome = jest.fn();
    render(
      <CreateWaveOutcomesManual
        {...defaultProps}
        waveType={ApiWaveType.Rank}
        onOutcome={mockOnOutcome}
      />
    );

    const actionInput = screen.getByLabelText("What winners receive");
    await userEvent.type(actionInput, "Test action");

    const positionsInput = screen.getByLabelText("Winning ranks");
    await userEvent.type(positionsInput, "1,3,5");

    const saveButton = screen.getByTestId("primary-button");
    await userEvent.click(saveButton);

    expect(mockOnOutcome).toHaveBeenCalled();
  });

  it("shows error for invalid position format", async () => {
    render(
      <CreateWaveOutcomesManual {...defaultProps} waveType={ApiWaveType.Rank} />
    );

    const actionInput = screen.getByLabelText("What winners receive");
    await userEvent.type(actionInput, "Test action");

    const positionsInput = screen.getByLabelText("Winning ranks");
    // Use a value that passes the input filter but fails format validation
    await userEvent.type(positionsInput, "1--3");

    const saveButton = screen.getByTestId("primary-button");
    await userEvent.click(saveButton);

    expect(
      screen.getByText(
        "Use ranks from 1 to 10,000 and ranges separated by commas, such as 1-3, 5, 7-9."
      )
    ).toBeInTheDocument();
    expect(positionsInput).toHaveFocus();
  });

  it.each(["10001", "1-10001"])(
    "rejects an individual rank or range above the safe limit: %s",
    async (ranks) => {
      const mockOnOutcome = jest.fn();
      render(
        <CreateWaveOutcomesManual
          {...defaultProps}
          waveType={ApiWaveType.Rank}
          onOutcome={mockOnOutcome}
        />
      );

      await userEvent.type(
        screen.getByLabelText("What winners receive"),
        "Test action"
      );
      const positionsInput = screen.getByLabelText("Winning ranks");
      await userEvent.type(positionsInput, ranks);
      await userEvent.click(screen.getByTestId("primary-button"));

      expect(
        screen.getByText(
          "Use ranks from 1 to 10,000 and ranges separated by commas, such as 1-3, 5, 7-9."
        )
      ).toBeInTheDocument();
      expect(mockOnOutcome).not.toHaveBeenCalled();
    }
  );

  it("calls onCancel when cancel button is clicked", async () => {
    const mockOnCancel = jest.fn();
    render(
      <CreateWaveOutcomesManual {...defaultProps} onCancel={mockOnCancel} />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await userEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("calls onOutcome with correct data for approve wave", async () => {
    const mockOnOutcome = jest.fn();
    render(
      <CreateWaveOutcomesManual
        {...defaultProps}
        waveType={ApiWaveType.Approve}
        onOutcome={mockOnOutcome}
      />
    );

    const actionInput = screen.getByLabelText("What winners receive");
    await userEvent.type(actionInput, "Approve action");

    const saveButton = screen.getByTestId("primary-button");
    await userEvent.click(saveButton);

    expect(mockOnOutcome).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Approve action",
        winnersConfig: null,
      })
    );
  });

  it("parses range positions correctly", async () => {
    const mockOnOutcome = jest.fn();
    render(
      <CreateWaveOutcomesManual
        {...defaultProps}
        waveType={ApiWaveType.Rank}
        onOutcome={mockOnOutcome}
      />
    );

    const actionInput = screen.getByLabelText("What winners receive");
    await userEvent.type(actionInput, "Rank action");

    const positionsInput = screen.getByLabelText("Winning ranks");
    await userEvent.type(positionsInput, "1-3, 5");

    const saveButton = screen.getByTestId("primary-button");
    await userEvent.click(saveButton);

    expect(mockOnOutcome).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Rank action",
        winnersConfig: expect.objectContaining({
          totalAmount: 4, // positions 1,2,3,5
          winners: expect.arrayContaining([
            { value: 1 }, // position 1
            { value: 1 }, // position 2
            { value: 1 }, // position 3
            { value: 0 }, // position 4
            { value: 1 }, // position 5
          ]),
        }),
      })
    );
  });

  it("filters invalid characters in positions input", async () => {
    render(
      <CreateWaveOutcomesManual {...defaultProps} waveType={ApiWaveType.Rank} />
    );

    const positionsInput = screen.getByLabelText("Winning ranks");
    await userEvent.type(positionsInput, "1,2abc,3");

    // Should only allow numbers, commas, and dashes
    expect(positionsInput).toHaveValue("1,2,3");
  });

  it("clears input empty error when value is entered", async () => {
    render(<CreateWaveOutcomesManual {...defaultProps} />);

    // First trigger the error
    const saveButton = screen.getByTestId("primary-button");
    await userEvent.click(saveButton);

    expect(
      screen.getByText("Describe what winners receive.")
    ).toBeInTheDocument();

    // Then enter a value to clear the error
    const actionInput = screen.getByLabelText("What winners receive");
    await userEvent.type(actionInput, "Action");

    expect(
      screen.queryByText("Describe what winners receive.")
    ).not.toBeInTheDocument();
  });
});
