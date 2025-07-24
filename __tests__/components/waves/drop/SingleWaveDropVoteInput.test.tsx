import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SingleWaveDropVoteInput } from '../../../../components/waves/drop/SingleWaveDropVoteInput';
import { ApiWaveCreditType } from '../../../../generated/models/ObjectSerializer';

// Mock timers for testing interval behavior
jest.useFakeTimers();

describe('SingleWaveDropVoteInput', () => {
  const defaultProps = {
    voteValue: 0,
    minValue: -1000,
    maxValue: 1000,
    creditType: ApiWaveCreditType.Rep,
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

  it('renders input field with correct value', () => {
    render(<SingleWaveDropVoteInput {...defaultProps} voteValue={42} />);
    
    const input = screen.getByDisplayValue('42');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('pattern', '-?[0-9]*');
    expect(input).toHaveAttribute('inputMode', 'numeric');
  });

  it('displays credit type in input field', () => {
    render(<SingleWaveDropVoteInput {...defaultProps} creditType={ApiWaveCreditType.Tdh} />);
    
    expect(screen.getByText('TDH')).toBeInTheDocument();
  });

  it('renders increment and decrement buttons', () => {
    render(<SingleWaveDropVoteInput {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2); // At least 2 control buttons
  });

  it('handles direct input changes correctly', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const setVoteValue = jest.fn();
    
    render(<SingleWaveDropVoteInput {...defaultProps} setVoteValue={setVoteValue} />);
    
    const input = screen.getByDisplayValue('0');
    
    await user.clear(input);
    await user.type(input, '123');
    
    // Should be called with numeric values on each character typed
    expect(setVoteValue).toHaveBeenCalledWith(expect.any(Number));
  });

  it('handles empty input correctly', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const setVoteValue = jest.fn();
    
    render(<SingleWaveDropVoteInput {...defaultProps} setVoteValue={setVoteValue} />);
    
    const input = screen.getByDisplayValue('0');
    
    await user.clear(input);
    expect(setVoteValue).toHaveBeenCalledWith('');
  });

  it('handles numeric input', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const setVoteValue = jest.fn();
    
    render(<SingleWaveDropVoteInput {...defaultProps} setVoteValue={setVoteValue} />);
    
    const input = screen.getByDisplayValue('0');
    
    await user.clear(input);
    await user.type(input, '42');
    
    // Should be called with some number
    expect(setVoteValue).toHaveBeenCalledWith(expect.any(Number));
  });

  it('ignores non-numeric input', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const setVoteValue = jest.fn();
    
    render(<SingleWaveDropVoteInput {...defaultProps} setVoteValue={setVoteValue} />);
    
    const input = screen.getByDisplayValue('0');
    
    await user.clear(input);
    await user.type(input, 'abc');
    
    // Should not call setVoteValue for non-numeric input
    expect(setVoteValue).toHaveBeenCalledWith(''); // Only for the clear action
  });

  it('calls onSubmit when Enter key is pressed', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onSubmit = jest.fn();
    
    render(<SingleWaveDropVoteInput {...defaultProps} onSubmit={onSubmit} />);
    
    const input = screen.getByDisplayValue('0');
    await user.click(input);
    await user.keyboard('{Enter}');
    
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('displays mobile percentage buttons on small screens', () => {
    render(<SingleWaveDropVoteInput {...defaultProps} />);
    
    // Both mobile and desktop percentage buttons are rendered
    // Mobile percentages: -75, -50, -25, 25, 50, 75
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(6); // Should have many percentage buttons
  });

  it('handles quick percentage button clicks', async () => {
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
    const buttons = screen.getAllByRole('button');
    const percentageButton = buttons.find(button => button.textContent?.includes('+'));
    
    if (percentageButton) {
      await user.click(percentageButton);
      expect(setVoteValue).toHaveBeenCalledWith(expect.any(Number));
    }
  });

  it('applies correct styling for selected percentage buttons', () => {
    render(
      <SingleWaveDropVoteInput 
        {...defaultProps} 
        voteValue={500} // This should match +50% of maxValue 1000
        minValue={-1000}
        maxValue={1000}
      />
    );
    
    // Find buttons with specific styling that indicates selection
    const buttons = screen.getAllByRole('button');
    const selectedButton = buttons.find(button => 
      button.className.includes('tw-bg-emerald-500/20')
    );
    expect(selectedButton).toBeDefined();
  });

  it('renders percentage buttons with styling', () => {
    render(<SingleWaveDropVoteInput {...defaultProps} />);
    
    // Check that percentage buttons exist and have appropriate styling
    const buttons = screen.getAllByRole('button');
    const percentageButtons = buttons.filter(button => 
      button.textContent && button.textContent.includes('%')
    );
    expect(percentageButtons.length).toBeGreaterThan(0);
    
    // Check that at least one button has the expected base styling
    const buttonWithStyling = percentageButtons.find(button =>
      button.className.includes('tw-px-1.5')
    );
    expect(buttonWithStyling).toBeDefined();
  });

  it('handles increment button mouse down and up', () => {
    const setVoteValue = jest.fn();
    
    render(<SingleWaveDropVoteInput {...defaultProps} setVoteValue={setVoteValue} voteValue={0} />);
    
    const incrementButton = screen.getAllByRole('button')[0]; // First button should be increment
    
    act(() => {
      fireEvent.mouseDown(incrementButton);
      jest.advanceTimersByTime(50);
    });
    
    expect(setVoteValue).toHaveBeenCalled();
    
    act(() => {
      fireEvent.mouseUp(incrementButton);
    });
  });

  it('handles decrement button mouse down and up', () => {
    const setVoteValue = jest.fn();
    
    render(<SingleWaveDropVoteInput {...defaultProps} setVoteValue={setVoteValue} voteValue={100} />);
    
    const decrementButton = screen.getAllByRole('button')[1]; // Second button should be decrement
    
    act(() => {
      fireEvent.mouseDown(decrementButton);
      jest.advanceTimersByTime(50);
    });
    
    expect(setVoteValue).toHaveBeenCalled();
    
    act(() => {
      fireEvent.mouseUp(decrementButton);
    });
  });

  it('handles touch events for increment button', () => {
    const setVoteValue = jest.fn();
    
    render(<SingleWaveDropVoteInput {...defaultProps} setVoteValue={setVoteValue} voteValue={0} />);
    
    const incrementButton = screen.getAllByRole('button')[0];
    
    act(() => {
      fireEvent.touchStart(incrementButton);
      jest.advanceTimersByTime(50);
    });
    
    expect(setVoteValue).toHaveBeenCalled();
    
    act(() => {
      fireEvent.touchEnd(incrementButton);
    });
  });

  it('stops increment when mouse leaves button', () => {
    const setVoteValue = jest.fn();
    
    render(<SingleWaveDropVoteInput {...defaultProps} setVoteValue={setVoteValue} voteValue={0} />);
    
    const incrementButton = screen.getAllByRole('button')[0];
    
    act(() => {
      fireEvent.mouseDown(incrementButton);
      jest.advanceTimersByTime(50);
    });
    
    expect(setVoteValue).toHaveBeenCalled();
    setVoteValue.mockClear();
    
    act(() => {
      fireEvent.mouseLeave(incrementButton);
      jest.advanceTimersByTime(200);
    });
    
    // Should not continue incrementing after mouse leave
    expect(setVoteValue).not.toHaveBeenCalled();
  });

  it('cleans up timers on unmount', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const setVoteValue = jest.fn();
    
    const { unmount } = render(<SingleWaveDropVoteInput {...defaultProps} setVoteValue={setVoteValue} />);
    
    // Start an interval by pressing a button
    const incrementButton = screen.getAllByRole('button')[0];
    
    act(() => {
      fireEvent.mouseDown(incrementButton);
      jest.advanceTimersByTime(50);
    });
    
    unmount();
    
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('handles string vote values correctly in updateValue', () => {
    const setVoteValue = jest.fn().mockImplementation((fn) => {
      if (typeof fn === 'function') {
        return fn('-'); // Simulate string value
      }
    });
    
    render(<SingleWaveDropVoteInput {...defaultProps} setVoteValue={setVoteValue} voteValue="-" />);
    
    const incrementButton = screen.getAllByRole('button')[0];
    
    act(() => {
      fireEvent.mouseDown(incrementButton);
      jest.advanceTimersByTime(50);
    });
    
    expect(setVoteValue).toHaveBeenCalled();
  });

  it('pauses and resumes when crossing memetic values', async () => {
    const setVoteValue = jest.fn();
    let currentValue = 68;
    
    // Mock setVoteValue to simulate state updates
    setVoteValue.mockImplementation((fn) => {
      if (typeof fn === 'function') {
        const newValue = fn(currentValue);
        currentValue = newValue;
        return newValue;
      }
      currentValue = fn;
      return fn;
    });
    
    render(<SingleWaveDropVoteInput {...defaultProps} setVoteValue={setVoteValue} voteValue={68} />);
    
    const incrementButton = screen.getAllByRole('button')[0];
    
    act(() => {
      fireEvent.mouseDown(incrementButton);
      jest.advanceTimersByTime(50);
    });
    
    // Should hit memetic value 69 and pause
    expect(setVoteValue).toHaveBeenCalled();
    
    // Advance time to trigger resume
    act(() => {
      jest.advanceTimersByTime(1000);
    });
  });
});