import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveOutcomesManual from "@/components/waves/create-wave/outcomes/manual/CreateWaveOutcomesManual";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

describe("CreateWaveOutcomesManual", () => {
  const defaultProps = {
    waveType: ApiWaveType.Approve,
    onOutcome: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders manual action input", () => {
    render(<CreateWaveOutcomesManual {...defaultProps} />);

    expect(screen.getByLabelText("Manual action")).toBeInTheDocument();
  });

  it("shows positions input for rank wave type", () => {
    render(
      <CreateWaveOutcomesManual {...defaultProps} waveType={ApiWaveType.Rank} />
    );

    expect(screen.getByLabelText(/Winning Positions/i)).toBeInTheDocument();
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

    expect(
      screen.queryByLabelText(/Winning Positions/i)
    ).not.toBeInTheDocument();
  });

  it("updates manual action value on input change", async () => {
    render(<CreateWaveOutcomesManual {...defaultProps} />);

    const input = screen.getByLabelText("Manual action");
    await userEvent.type(input, "Test action");

    expect(input).toHaveValue("Test action");
  });

  it("shows error when submitting without manual action", async () => {
    render(<CreateWaveOutcomesManual {...defaultProps} />);

    const saveButton = screen.getByRole("button", { name: "Save" });
    await userEvent.click(saveButton);

    expect(
      screen.getByText("Please enter your manual action")
    ).toBeInTheDocument();
  });

  it("shows error for rank wave without positions", async () => {
    render(
      <CreateWaveOutcomesManual {...defaultProps} waveType={ApiWaveType.Rank} />
    );

    const actionInput = screen.getByLabelText("Manual action");
    await userEvent.type(actionInput, "Test action");

    const saveButton = screen.getByRole("button", { name: "Save" });
    await userEvent.click(saveButton);

    expect(screen.getByText("Please enter positions")).toBeInTheDocument();
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

    const actionInput = screen.getByLabelText("Manual action");
    await userEvent.type(actionInput, "Test action");

    const positionsInput = screen.getByLabelText(/Winning Positions/i);
    await userEvent.type(positionsInput, "1,3,5");

    const saveButton = screen.getByRole("button", { name: "Save" });
    await userEvent.click(saveButton);

    expect(mockOnOutcome).toHaveBeenCalled();
  });

  it("shows error for invalid position format", async () => {
    render(
      <CreateWaveOutcomesManual {...defaultProps} waveType={ApiWaveType.Rank} />
    );

    const actionInput = screen.getByLabelText("Manual action");
    await userEvent.type(actionInput, "Test action");

    const positionsInput = screen.getByLabelText(/Winning Positions/i);
    // Use a value that passes the input filter but fails format validation
    await userEvent.type(positionsInput, "1--3");

    const saveButton = screen.getByRole("button", { name: "Save" });
    await userEvent.click(saveButton);

    expect(screen.getByText("Invalid position format")).toBeInTheDocument();
  });

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

    const actionInput = screen.getByLabelText("Manual action");
    await userEvent.type(actionInput, "Approve action");

    const saveButton = screen.getByRole("button", { name: "Save" });
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

    const actionInput = screen.getByLabelText("Manual action");
    await userEvent.type(actionInput, "Rank action");

    const positionsInput = screen.getByLabelText(/Winning Positions/i);
    await userEvent.type(positionsInput, "1-3,5");

    const saveButton = screen.getByRole("button", { name: "Save" });
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

    const positionsInput = screen.getByLabelText(/Winning Positions/i);
    await userEvent.type(positionsInput, "1,2abc,3");

    // Should only allow numbers, commas, and dashes
    expect(positionsInput).toHaveValue("1,2,3");
  });

  it("clears input empty error when value is entered", async () => {
    render(<CreateWaveOutcomesManual {...defaultProps} />);

    // First trigger the error
    const saveButton = screen.getByRole("button", { name: "Save" });
    await userEvent.click(saveButton);

    expect(
      screen.getByText("Please enter your manual action")
    ).toBeInTheDocument();

    // Then enter a value to clear the error
    const actionInput = screen.getByLabelText("Manual action");
    await userEvent.type(actionInput, "Action");

    expect(
      screen.queryByText("Please enter your manual action")
    ).not.toBeInTheDocument();
  });
  describe("rejects out-of-range positions", () => {
    const submitPositions = async (input: string) => {
      const mockOnOutcome = jest.fn();
      render(
        <CreateWaveOutcomesManual
          {...defaultProps}
          waveType={ApiWaveType.Rank}
          onOutcome={mockOnOutcome}
        />
      );

      await userEvent.type(
        screen.getByLabelText("Manual action"),
        "Rank action"
      );
      await userEvent.type(screen.getByLabelText(/Winning Positions/i), input);
      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      return mockOnOutcome;
    };

    it("rejects a reversed range and names the offending segment", async () => {
      const mockOnOutcome = await submitPositions("3-1");

      expect(
        screen.getByText(
          "Range 3-1 is backwards — put the lower position first"
        )
      ).toBeInTheDocument();
      expect(mockOnOutcome).not.toHaveBeenCalled();
    });

    it("rejects a range starting below the first position", async () => {
      const mockOnOutcome = await submitPositions("0-2");

      expect(screen.getByText("Positions start at 1")).toBeInTheDocument();
      expect(mockOnOutcome).not.toHaveBeenCalled();
    });

    it("rejects an oversized single position instead of crashing on allocation", async () => {
      // Without the cap this did `new Array(5_000_000_000)` at submit and threw
      // "RangeError: Invalid array length", taking the form down with it.
      const mockOnOutcome = await submitPositions("5000000000");

      expect(
        screen.getByText("Positions can't go above 10,000")
      ).toBeInTheDocument();
      expect(mockOnOutcome).not.toHaveBeenCalled();
    });

    it("rejects an oversized range", async () => {
      const mockOnOutcome = await submitPositions("1-5000000000");

      expect(
        screen.getByText("Positions can't go above 10,000")
      ).toBeInTheDocument();
      expect(mockOnOutcome).not.toHaveBeenCalled();
    });

    it("accepts the maximum position itself", async () => {
      const mockOnOutcome = await submitPositions("10000");

      expect(mockOnOutcome).toHaveBeenCalled();
    });

    it("rejects one past the maximum position", async () => {
      const mockOnOutcome = await submitPositions("10001");

      expect(
        screen.getByText("Positions can't go above 10,000")
      ).toBeInTheDocument();
      expect(mockOnOutcome).not.toHaveBeenCalled();
    });
  });

  // A list mixing a valid position with an invalid one used to submit the valid
  // part silently, so someone who typed "1,0-2" got a first-place-only outcome
  // with no indication the rest had been dropped. Any bad segment now rejects the
  // whole input, matching how malformed input has always behaved.
  describe("mixed valid and invalid segments", () => {
    const submitPositions = async (input: string) => {
      const mockOnOutcome = jest.fn();
      render(
        <CreateWaveOutcomesManual
          {...defaultProps}
          waveType={ApiWaveType.Rank}
          onOutcome={mockOnOutcome}
        />
      );

      await userEvent.type(
        screen.getByLabelText("Manual action"),
        "Rank action"
      );
      await userEvent.type(screen.getByLabelText(/Winning Positions/i), input);
      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      return mockOnOutcome;
    };

    it("rejects the whole list when a segment starts below the first position", async () => {
      const mockOnOutcome = await submitPositions("1,0-2");

      expect(screen.getByText("Positions start at 1")).toBeInTheDocument();
      expect(mockOnOutcome).not.toHaveBeenCalled();
    });

    it("rejects the whole list when a segment exceeds the maximum", async () => {
      const mockOnOutcome = await submitPositions("1,1-5000000000");

      expect(
        screen.getByText("Positions can't go above 10,000")
      ).toBeInTheDocument();
      expect(mockOnOutcome).not.toHaveBeenCalled();
    });

    it("rejects the whole list when a later segment is backwards", async () => {
      const mockOnOutcome = await submitPositions("1-3,9-5");

      expect(
        screen.getByText(
          "Range 9-5 is backwards — put the lower position first"
        )
      ).toBeInTheDocument();
      expect(mockOnOutcome).not.toHaveBeenCalled();
    });

    it("reports the first offending segment when several are invalid", async () => {
      const mockOnOutcome = await submitPositions("0-2,99999");

      expect(screen.getByText("Positions start at 1")).toBeInTheDocument();
      expect(
        screen.queryByText("Positions can't go above 10,000")
      ).not.toBeInTheDocument();
      expect(mockOnOutcome).not.toHaveBeenCalled();
    });

    it("still accepts a list where every segment is valid, deduped and sorted", async () => {
      const mockOnOutcome = await submitPositions("3,1-2,2");

      expect(mockOnOutcome).toHaveBeenCalledWith(
        expect.objectContaining({
          winnersConfig: expect.objectContaining({
            totalAmount: 3,
            winners: [{ value: 1 }, { value: 1 }, { value: 1 }],
          }),
        })
      );
    });
  });
});
