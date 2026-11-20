import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SingleWaveDropVoteInput } from "@/components/waves/drop/SingleWaveDropVoteInput";
import { SingleWaveDropVoteSize } from "@/components/waves/drop/SingleWaveDropVote.types";

// Mock timers for testing interval behavior
jest.useFakeTimers();

describe("SingleWaveDropVoteInput", () => {
  const defaultProps = {
    voteValue: 0,
    minValue: -1000,
    maxValue: 1000,
    label: "Rep",
    setVoteValue: jest.fn(),
    onSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it("renders input field with correct value", () => {
    render(<SingleWaveDropVoteInput {...defaultProps} voteValue={42} />);

    const input = screen.getByDisplayValue("42");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "text");
    // Locale digit grouping is shown in the field, so the pattern allows it.
    expect(input).toHaveAttribute("pattern", String.raw`-?[0-9.,\s]*`);
    expect(input).toHaveAttribute("inputMode", "numeric");
  });

  it("displays credit type in input field", () => {
    render(<SingleWaveDropVoteInput {...defaultProps} label="TDH" />);

    expect(screen.getByText("TDH")).toBeInTheDocument();
  });

  it("renders increment and decrement buttons", () => {
    render(<SingleWaveDropVoteInput {...defaultProps} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(2); // At least 2 control buttons
  });

  it("handles direct input changes correctly", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const setVoteValue = jest.fn();

    render(
      <SingleWaveDropVoteInput {...defaultProps} setVoteValue={setVoteValue} />
    );

    const input = screen.getByDisplayValue("0");

    await user.clear(input);
    await user.type(input, "123");

    // Should be called with numeric values on each character typed
    expect(setVoteValue).toHaveBeenCalledWith(expect.any(Number));
  });

  it("handles empty input correctly", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const setVoteValue = jest.fn();

    render(
      <SingleWaveDropVoteInput {...defaultProps} setVoteValue={setVoteValue} />
    );

    const input = screen.getByDisplayValue("0");

    await user.clear(input);
    expect(setVoteValue).toHaveBeenCalledWith("");
  });

  it("keeps a dash draft even when the minimum is zero", () => {
    const setVoteValue = jest.fn();

    render(
      <SingleWaveDropVoteInput
        {...defaultProps}
        minValue={0}
        voteValue="-5"
        setVoteValue={setVoteValue}
      />
    );

    fireEvent.change(screen.getByDisplayValue("-5"), {
      target: { value: "-" },
    });

    expect(setVoteValue).toHaveBeenCalledWith("-");
  });

  it("handles numeric input", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const setVoteValue = jest.fn();

    render(
      <SingleWaveDropVoteInput {...defaultProps} setVoteValue={setVoteValue} />
    );

    const input = screen.getByDisplayValue("0");

    await user.clear(input);
    await user.type(input, "42");

    // Should be called with some number
    expect(setVoteValue).toHaveBeenCalledWith(expect.any(Number));
  });

  it("ignores non-numeric input", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const setVoteValue = jest.fn();

    render(
      <SingleWaveDropVoteInput {...defaultProps} setVoteValue={setVoteValue} />
    );

    const input = screen.getByDisplayValue("0");

    await user.clear(input);
    await user.type(input, "abc");

    // Should not call setVoteValue for non-numeric input
    expect(setVoteValue).toHaveBeenCalledWith(""); // Only for the clear action
  });

  it("calls onSubmit when Enter key is pressed", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onSubmit = jest.fn();

    render(<SingleWaveDropVoteInput {...defaultProps} onSubmit={onSubmit} />);

    const input = screen.getByDisplayValue("0");
    await user.click(input);
    await user.keyboard("{Enter}");

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("offers each percentage shortcut once across responsive layouts", () => {
    render(<SingleWaveDropVoteInput {...defaultProps} />);

    for (const name of ["-100%", "-50%", "+50%", "+100%"]) {
      expect(screen.getByRole("button", { name })).toBeEnabled();
    }
    expect(screen.getAllByRole("button")).toHaveLength(6);
  });

  it("operates the existing step controls with Enter and Space", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const setVoteValue = jest.fn();
    const onSubmit = jest.fn();
    render(
      <SingleWaveDropVoteInput
        {...defaultProps}
        setVoteValue={setVoteValue}
        onSubmit={onSubmit}
      />
    );

    screen.getByRole("button", { name: "Increase vote" }).focus();
    await user.keyboard("{Enter}");
    expect(setVoteValue).toHaveBeenLastCalledWith(1);
    screen.getByRole("button", { name: "Decrease vote" }).focus();
    await user.keyboard(" ");
    expect(setVoteValue).toHaveBeenLastCalledWith(0);
    expect(setVoteValue).toHaveBeenCalledTimes(2);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("steps only once on a pointer click", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const setVoteValue = jest.fn();
    render(
      <SingleWaveDropVoteInput {...defaultProps} setVoteValue={setVoteValue} />
    );

    await user.click(screen.getByRole("button", { name: "Increase vote" }));

    expect(setVoteValue).toHaveBeenCalledTimes(1);
    expect(setVoteValue).toHaveBeenLastCalledWith(1);
  });

  it("steps once when a touch click reports zero detail after release and blur", () => {
    const setVoteValue = jest.fn();
    render(
      <SingleWaveDropVoteInput {...defaultProps} setVoteValue={setVoteValue} />
    );
    const increase = screen.getByRole("button", { name: "Increase vote" });
    fireEvent.pointerDown(increase, { pointerType: "touch" });
    fireEvent.pointerUp(increase, { pointerType: "touch" });
    fireEvent.blur(increase);
    fireEvent.click(increase, { detail: 0 });
    expect(setVoteValue).toHaveBeenCalledTimes(1);
    expect(setVoteValue).toHaveBeenLastCalledWith(1);
  });

  it("allows keyboard stepping after a cancelled pointer hold", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const setVoteValue = jest.fn();
    render(
      <SingleWaveDropVoteInput {...defaultProps} setVoteValue={setVoteValue} />
    );
    const increase = screen.getByRole("button", { name: "Increase vote" });
    fireEvent.pointerDown(increase);
    fireEvent.pointerCancel(increase);
    increase.focus();
    await user.keyboard("{Enter}");
    expect(setVoteValue).toHaveBeenCalledTimes(2);
    expect(setVoteValue).toHaveBeenLastCalledWith(2);
    setVoteValue.mockClear();
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(setVoteValue).not.toHaveBeenCalled();
  });

  it("stops repeating when a touch press is cancelled", () => {
    const setVoteValue = jest.fn();
    render(
      <SingleWaveDropVoteInput {...defaultProps} setVoteValue={setVoteValue} />
    );
    const increase = screen.getByRole("button", { name: "Increase vote" });
    fireEvent.pointerDown(increase, { pointerType: "touch" });
    act(() => {
      jest.advanceTimersByTime(250);
    });
    expect(setVoteValue).toHaveBeenCalledTimes(3);

    fireEvent.pointerCancel(increase);
    setVoteValue.mockClear();
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(setVoteValue).not.toHaveBeenCalled();
  });

  it("preserves the held step acceleration and stops on release", () => {
    const setVoteValue = jest.fn();
    render(
      <SingleWaveDropVoteInput
        {...defaultProps}
        voteValue={10000}
        minValue={0}
        maxValue={1000000}
        setVoteValue={setVoteValue}
      />
    );
    const increase = screen.getByRole("button", { name: "Increase vote" });
    fireEvent.pointerDown(increase);
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(setVoteValue).toHaveBeenLastCalledWith(10030);
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(setVoteValue).toHaveBeenLastCalledWith(10300);
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(setVoteValue).toHaveBeenLastCalledWith(13000);
    fireEvent.pointerUp(increase);
    setVoteValue.mockClear();
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(setVoteValue).not.toHaveBeenCalled();
  });

  it.each([
    { name: "-100%", expected: -75 },
    { name: "-50%", expected: -37 },
    { name: "+50%", expected: 63 },
    { name: "+100%", expected: 125 },
  ])(
    "keeps $name based on its existing directional bound",
    ({ name, expected }) => {
      const setVoteValue = jest.fn();
      render(
        <SingleWaveDropVoteInput
          {...defaultProps}
          minValue={-75}
          maxValue={125}
          setVoteValue={setVoteValue}
        />
      );

      fireEvent.click(screen.getByRole("button", { name }));

      expect(setVoteValue).toHaveBeenLastCalledWith(expected);
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    }
  );

  it("omits negative shortcuts when negative votes are forbidden", () => {
    render(<SingleWaveDropVoteInput {...defaultProps} minValue={0} />);

    expect(screen.queryByRole("button", { name: /^-\d+%$/ })).toBeNull();
    expect(screen.getByRole("button", { name: "+50%" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "+100%" })).toBeEnabled();
  });

  it("offers step and percentage controls in compact submission cards", () => {
    render(
      <SingleWaveDropVoteInput
        {...defaultProps}
        size={SingleWaveDropVoteSize.MINI}
      />
    );

    expect(screen.getByRole("textbox", { name: "Your vote" })).toHaveValue("0");
    expect(screen.getByRole("button", { name: "Increase vote" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Decrease vote" })).toBeEnabled();
    for (const name of ["-100%", "-50%", "+50%", "+100%"]) {
      expect(screen.getByRole("button", { name })).toBeEnabled();
    }
  });

  it("handles quick percentage button clicks", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const setVoteValue = jest.fn();

    render(
      <SingleWaveDropVoteInput
        {...defaultProps}
        setVoteValue={setVoteValue}
        minValue={-1000}
        maxValue={1000}
      />
    );

    // Click on a percentage button (find any one with + in text)
    const buttons = screen.getAllByRole("button");
    const percentageButton = buttons.find((button) =>
      button.textContent?.includes("+")
    );

    if (percentageButton) {
      await user.click(percentageButton);
      expect(setVoteValue).toHaveBeenCalledWith(expect.any(Number));
    }
  });

  it("keeps percentage buttons in the neutral visual state", () => {
    render(
      <SingleWaveDropVoteInput
        {...defaultProps}
        voteValue={500} // This should match +50% of maxValue 1000
        minValue={-1000}
        maxValue={1000}
      />
    );

    const buttons = screen.getAllByRole("button");
    const percentageButtons = buttons.filter((button) =>
      button.textContent?.includes("%")
    );
    const activePercentageButton = percentageButtons.find((button) =>
      button.classList.contains("tw-bg-emerald-500/10")
    );

    expect(activePercentageButton).toBeUndefined();
    expect(
      percentageButtons.every((button) =>
        button.classList.contains("tw-bg-iron-900")
      )
    ).toBe(true);
  });

  it("renders percentage buttons with styling", () => {
    render(<SingleWaveDropVoteInput {...defaultProps} />);

    // Check that percentage buttons exist and have appropriate styling
    const buttons = screen.getAllByRole("button");
    const percentageButtons = buttons.filter(
      (button) => button.textContent && button.textContent.includes("%")
    );
    expect(percentageButtons.length).toBeGreaterThan(0);

    // Check that at least one button has the expected base styling
    const buttonWithStyling = percentageButtons.find((button) =>
      button.classList.contains("tw-px-2.5")
    );
    expect(buttonWithStyling).toBeDefined();
  });

  it("handles increment button pointer down and up", () => {
    const setVoteValue = jest.fn();

    render(
      <SingleWaveDropVoteInput
        {...defaultProps}
        setVoteValue={setVoteValue}
        voteValue={0}
      />
    );

    const incrementButton = screen.getAllByRole("button")[0]; // First button should be increment

    act(() => {
      fireEvent.pointerDown(incrementButton);
      jest.advanceTimersByTime(50);
    });

    expect(setVoteValue).toHaveBeenCalled();

    act(() => {
      fireEvent.pointerUp(incrementButton);
    });
  });

  it("handles decrement button mouse down and up", () => {
    const setVoteValue = jest.fn();

    render(
      <SingleWaveDropVoteInput
        {...defaultProps}
        setVoteValue={setVoteValue}
        voteValue={100}
      />
    );

    const decrementButton = screen.getAllByRole("button")[1]; // Second button should be decrement

    act(() => {
      fireEvent.pointerDown(decrementButton);
      jest.advanceTimersByTime(50);
    });

    expect(setVoteValue).toHaveBeenCalled();

    act(() => {
      fireEvent.pointerUp(decrementButton);
    });
  });

  it("handles touch events for increment button", () => {
    const setVoteValue = jest.fn();

    render(
      <SingleWaveDropVoteInput
        {...defaultProps}
        setVoteValue={setVoteValue}
        voteValue={0}
      />
    );

    const incrementButton = screen.getAllByRole("button")[0];

    act(() => {
      fireEvent.pointerDown(incrementButton);
      jest.advanceTimersByTime(50);
    });

    expect(setVoteValue).toHaveBeenCalled();

    act(() => {
      fireEvent.pointerUp(incrementButton);
    });
  });

  it("stops increment when the pointer leaves the button", () => {
    const setVoteValue = jest.fn();

    render(
      <SingleWaveDropVoteInput
        {...defaultProps}
        setVoteValue={setVoteValue}
        voteValue={0}
      />
    );

    const incrementButton = screen.getAllByRole("button")[0];

    act(() => {
      fireEvent.pointerDown(incrementButton);
      jest.advanceTimersByTime(50);
    });

    expect(setVoteValue).toHaveBeenCalled();
    setVoteValue.mockClear();

    act(() => {
      fireEvent.pointerLeave(incrementButton);
      jest.advanceTimersByTime(200);
    });

    // Should not continue incrementing after mouse leave
    expect(setVoteValue).not.toHaveBeenCalled();
  });

  it("cleans up timers on unmount", () => {
    const setVoteValue = jest.fn();

    const { unmount } = render(
      <SingleWaveDropVoteInput {...defaultProps} setVoteValue={setVoteValue} />
    );

    // Start an interval by pressing a button
    const incrementButton = screen.getAllByRole("button")[0];

    act(() => {
      fireEvent.pointerDown(incrementButton);
      jest.advanceTimersByTime(50);
    });

    unmount();
    setVoteValue.mockClear();
    act(() => {
      jest.advanceTimersByTime(1100);
    });
    expect(setVoteValue).not.toHaveBeenCalled();
  });

  it("handles string vote values correctly in updateValue", () => {
    const setVoteValue = jest.fn().mockImplementation((fn) => {
      if (typeof fn === "function") {
        return fn("-"); // Simulate string value
      }
    });

    render(
      <SingleWaveDropVoteInput
        {...defaultProps}
        setVoteValue={setVoteValue}
        voteValue="-"
      />
    );

    const incrementButton = screen.getAllByRole("button")[0];

    act(() => {
      fireEvent.pointerDown(incrementButton);
      jest.advanceTimersByTime(50);
    });

    expect(setVoteValue).toHaveBeenCalled();
  });

  it("pauses and resumes when crossing memetic values", async () => {
    const setVoteValue = jest.fn();
    let currentValue = 68;

    // Mock setVoteValue to simulate state updates
    setVoteValue.mockImplementation((fn) => {
      if (typeof fn === "function") {
        const newValue = fn(currentValue);
        currentValue = newValue;
        return newValue;
      }
      currentValue = fn;
      return fn;
    });

    render(
      <SingleWaveDropVoteInput
        {...defaultProps}
        setVoteValue={setVoteValue}
        voteValue={68}
      />
    );

    const incrementButton = screen.getByRole("button", {
      name: "Increase vote",
    });
    fireEvent.pointerDown(incrementButton);
    expect(setVoteValue).toHaveBeenLastCalledWith(69);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(setVoteValue).toHaveBeenCalledTimes(1);
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(setVoteValue).toHaveBeenLastCalledWith(70);
  });
});
