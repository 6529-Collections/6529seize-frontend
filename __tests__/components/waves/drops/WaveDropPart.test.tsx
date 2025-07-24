import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WaveDropPart from '../../../../components/waves/drops/WaveDropPart';
import { ExtendedDrop } from '../../../../helpers/waves/drop.helpers';

// Mock the WaveDropPartDrop component
jest.mock('../../../../components/waves/drops/WaveDropPartDrop', () => {
  return function MockWaveDropPartDrop(props: any) {
    return (
      <div data-testid="wave-drop-part-drop">
        <div data-testid="drop-id">{props.drop.id}</div>
        <div data-testid="active-part-index">{props.activePartIndex}</div>
        <div data-testid="is-storm">{props.isStorm.toString()}</div>
        <button 
          data-testid="quote-button" 
          onClick={() => props.onQuoteClick(props.drop)}
        >
          Quote
        </button>
      </div>
    );
  };
});

describe('WaveDropPart', () => {
  const mockSetActivePartIndex = jest.fn();
  const mockOnDropContentClick = jest.fn();
  const mockOnQuoteClick = jest.fn();
  const mockOnLongPress = jest.fn();
  const mockSetLongPressTriggered = jest.fn();

  const mockSinglePartDrop: ExtendedDrop = {
    id: 'drop-1',
    parts: [
      {
        content: 'Single part content',
        quoted_drop: null,
        media: []
      }
    ]
  } as ExtendedDrop;

  const mockMultiPartDrop: ExtendedDrop = {
    id: 'drop-2',
    parts: [
      {
        content: 'Part 1 content',
        quoted_drop: null,
        media: []
      },
      {
        content: 'Part 2 content',
        quoted_drop: null,
        media: []
      },
      {
        content: 'Part 3 content',
        quoted_drop: null,
        media: []
      }
    ]
  } as ExtendedDrop;

  const mockTemporaryDrop: ExtendedDrop = {
    id: 'temp-123',
    parts: [
      {
        content: 'Temporary content',
        quoted_drop: null,
        media: []
      }
    ]
  } as ExtendedDrop;

  const defaultProps = {
    drop: mockSinglePartDrop,
    activePartIndex: 0,
    setActivePartIndex: mockSetActivePartIndex,
    onDropContentClick: mockOnDropContentClick,
    onQuoteClick: mockOnQuoteClick,
    onLongPress: mockOnLongPress,
    setLongPressTriggered: mockSetLongPressTriggered
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Component Rendering', () => {
    it('renders with single part drop', () => {
      render(<WaveDropPart {...defaultProps} />);

      expect(screen.getByTestId('wave-drop-part-drop')).toBeInTheDocument();
      expect(screen.getByTestId('drop-id')).toHaveTextContent('drop-1');
      expect(screen.getByTestId('active-part-index')).toHaveTextContent('0');
      expect(screen.getByTestId('is-storm')).toHaveTextContent('false');
    });

    it('renders with multi-part drop (storm)', () => {
      render(
        <WaveDropPart
          {...defaultProps}
          drop={mockMultiPartDrop}
          activePartIndex={1}
        />
      );

      expect(screen.getByTestId('is-storm')).toHaveTextContent('true');
      expect(screen.getByTestId('active-part-index')).toHaveTextContent('1');
    });

    it('applies correct CSS classes for clickable drops', () => {
      render(<WaveDropPart {...defaultProps} />);

      const containers = screen.getAllByRole('button');
      const dropContainer = containers.find(el => el.className.includes('tw-cursor-pointer'));
      expect(dropContainer).toHaveClass('tw-cursor-pointer');
      expect(dropContainer).not.toHaveClass('tw-cursor-default');
    });

    it('applies correct CSS classes for temporary drops', () => {
      render(
        <WaveDropPart
          {...defaultProps}
          drop={mockTemporaryDrop}
        />
      );

      const container = screen.getByTestId('wave-drop-part-drop').parentElement?.parentElement;
      expect(container?.className).toContain('tw-cursor-default');
      expect(container?.className).not.toContain('tw-cursor-pointer');
    });

    it('applies correct accessibility attributes for clickable drops', () => {
      render(<WaveDropPart {...defaultProps} />);

      const containers = screen.getAllByRole('button');
      const dropContainer = containers.find(el => el.className.includes('tw-cursor-pointer'));
      expect(dropContainer).toHaveAttribute('role', 'button');
      expect(dropContainer).toHaveAttribute('tabIndex', '0');
    });

    it('does not apply accessibility attributes for temporary drops', () => {
      render(
        <WaveDropPart
          {...defaultProps}
          drop={mockTemporaryDrop}
        />
      );

      const container = screen.getByTestId('wave-drop-part-drop').parentElement;
      expect(container).not.toHaveAttribute('role');
      expect(container).not.toHaveAttribute('tabIndex');
    });
  });

  describe('Click Handling', () => {
    it('calls onDropContentClick when clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<WaveDropPart {...defaultProps} />);

      const containers = screen.getAllByRole('button');
      const dropContainer = containers.find(el => el.className.includes('tw-cursor-pointer'));
      await user.click(dropContainer!);

      expect(mockOnDropContentClick).toHaveBeenCalledWith(mockSinglePartDrop);
    });

    it('does not call onDropContentClick for temporary drops', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(
        <WaveDropPart
          {...defaultProps}
          drop={mockTemporaryDrop}
        />
      );

      const container = screen.getByTestId('wave-drop-part-drop').parentElement;
      await user.click(container!);

      expect(mockOnDropContentClick).not.toHaveBeenCalled();
    });

    it('does not call onDropContentClick when text is selected', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      // Mock window.getSelection to return selected text
      Object.defineProperty(window, 'getSelection', {
        writable: true,
        value: jest.fn(() => ({
          toString: () => 'selected text'
        }))
      });

      render(<WaveDropPart {...defaultProps} />);

      const containers = screen.getAllByRole('button');
      const dropContainer = containers.find(el => el.className.includes('tw-cursor-pointer'));
      await user.click(dropContainer!);

      expect(mockOnDropContentClick).not.toHaveBeenCalled();
    });

    it('calls onDropContentClick on Enter key press', () => {
      // Mock window.getSelection to return empty string
      Object.defineProperty(window, 'getSelection', {
        writable: true,
        value: jest.fn(() => ({
          toString: () => ''
        }))
      });

      render(<WaveDropPart {...defaultProps} />);

      const containers = screen.getAllByRole('button');
      const dropContainer = containers.find(el => el.className.includes('tw-cursor-pointer'));
      fireEvent.keyDown(dropContainer!, { key: 'Enter' });

      expect(mockOnDropContentClick).toHaveBeenCalledWith(mockSinglePartDrop);
    });

    it('does not call onDropContentClick for other keys', () => {
      render(<WaveDropPart {...defaultProps} />);

      const containers = screen.getAllByRole('button');
      const dropContainer = containers.find(el => el.className.includes('tw-cursor-pointer'));
      fireEvent.keyDown(dropContainer!, { key: 'Space' });

      expect(mockOnDropContentClick).not.toHaveBeenCalled();
    });
  });

  describe('Long Press Handling', () => {
    it('triggers long press after timeout', () => {
      render(<WaveDropPart {...defaultProps} />);

      const containers = screen.getAllByRole('button');
      const container = containers.find(el => el.className.includes('tw-cursor-pointer'))!;
      
      fireEvent.touchStart(container, {
        touches: [{ clientX: 100, clientY: 100 }]
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(mockSetLongPressTriggered).toHaveBeenCalledWith(true);
      expect(mockOnLongPress).toHaveBeenCalled();
    });

    it('cancels long press on touch move beyond threshold', () => {
      render(<WaveDropPart {...defaultProps} />);

      const containers = screen.getAllByRole('button');
      const container = containers.find(el => el.className.includes('tw-cursor-pointer'))!;
      
      fireEvent.touchStart(container, {
        touches: [{ clientX: 100, clientY: 100 }]
      });

      fireEvent.touchMove(container, {
        touches: [{ clientX: 120, clientY: 100 }] // Move 20px horizontally
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(mockSetLongPressTriggered).not.toHaveBeenCalledWith(true);
      expect(mockOnLongPress).not.toHaveBeenCalled();
    });

    it('cancels long press on touch end', () => {
      render(<WaveDropPart {...defaultProps} />);

      const containers = screen.getAllByRole('button');
      const container = containers.find(el => el.className.includes('tw-cursor-pointer'))!;
      
      fireEvent.touchStart(container, {
        touches: [{ clientX: 100, clientY: 100 }]
      });

      fireEvent.touchEnd(container);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(mockSetLongPressTriggered).toHaveBeenCalledWith(false);
      expect(mockOnLongPress).not.toHaveBeenCalled();
    });

    it('does not trigger long press for temporary drops', () => {
      render(
        <WaveDropPart
          {...defaultProps}
          drop={mockTemporaryDrop}
        />
      );

      const container = screen.getByTestId('wave-drop-part-drop').parentElement;
      
      fireEvent.touchStart(container!, {
        touches: [{ clientX: 100, clientY: 100 }]
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(mockSetLongPressTriggered).not.toHaveBeenCalledWith(true);
      expect(mockOnLongPress).not.toHaveBeenCalled();
    });

    it('handles touch cancel like touch end', () => {
      render(<WaveDropPart {...defaultProps} />);

      const containers = screen.getAllByRole('button');
      const container = containers.find(el => el.className.includes('tw-cursor-pointer'))!;
      
      fireEvent.touchStart(container, {
        touches: [{ clientX: 100, clientY: 100 }]
      });

      fireEvent.touchCancel(container);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(mockSetLongPressTriggered).toHaveBeenCalledWith(false);
      expect(mockOnLongPress).not.toHaveBeenCalled();
    });
  });

  describe('Active Part Updates', () => {
    it('updates active part when activePartIndex changes', () => {
      const { rerender } = render(
        <WaveDropPart
          {...defaultProps}
          drop={mockMultiPartDrop}
          activePartIndex={0}
        />
      );

      expect(screen.getByTestId('active-part-index')).toHaveTextContent('0');

      rerender(
        <WaveDropPart
          {...defaultProps}
          drop={mockMultiPartDrop}
          activePartIndex={2}
        />
      );

      expect(screen.getByTestId('active-part-index')).toHaveTextContent('2');
    });

    it('updates active part when drop parts change', () => {
      const { rerender } = render(
        <WaveDropPart
          {...defaultProps}
          drop={mockSinglePartDrop}
        />
      );

      rerender(
        <WaveDropPart
          {...defaultProps}
          drop={mockMultiPartDrop}
        />
      );

      expect(screen.getByTestId('is-storm')).toHaveTextContent('true');
    });
  });

  describe('Quote Functionality', () => {
    it('passes quote click handler to child component', () => {
      render(<WaveDropPart {...defaultProps} />);

      fireEvent.click(screen.getByTestId('quote-button'));

      expect(mockOnQuoteClick).toHaveBeenCalledWith(mockSinglePartDrop);
    });
  });

  describe('Component Props Forwarding', () => {
    it('passes all required props to WaveDropPartDrop', () => {
      render(
        <WaveDropPart
          {...defaultProps}
          drop={mockMultiPartDrop}
          activePartIndex={1}
        />
      );

      expect(screen.getByTestId('drop-id')).toHaveTextContent('drop-2');
      expect(screen.getByTestId('active-part-index')).toHaveTextContent('1');
      expect(screen.getByTestId('is-storm')).toHaveTextContent('true');
    });
  });
});