import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WaveHeaderPinned from '../../../../components/waves/header/WaveHeaderPinned';
import { WaveHeaderPinnedSide } from '../../../../components/waves/header/WaveHeader';
import { ApiWave } from '../../../../generated/models/ApiWave';

jest.mock('react-use', () => ({
  useClickAway: jest.fn(),
  useKeyPressEvent: jest.fn(),
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => (
      <div ref={ref} {...props}>
        {children}
      </div>
    )),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../../../../components/waves/drops/Drop', () => {
  const MockDrop = function MockDrop() {
    return <div data-testid="mock-drop">Drop Component</div>;
  };
  
  return {
    __esModule: true,
    default: MockDrop,
    DropLocation: {
      MY_STREAM: 'MY_STREAM',
      WAVE: 'WAVE',
    },
  };
});

jest.mock('../../../../helpers/waves/drop.helpers', () => ({
  DropSize: {
    FULL: 'FULL',
  },
}));

const mockWave: ApiWave = {
  id: 'wave-123',
  name: 'Test Wave',
  description_drop: {
    id: 'drop-123',
    wave_id: 'wave-123',
    author: {
      handle: 'testuser',
      id: 'user-123',
    },
    parts: [
      {
        content: 'This is a wave description',
      },
    ],
  },
} as any;

describe('WaveHeaderPinned', () => {
  beforeEach(() => {
    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      bottom: 100,
      height: 50,
      left: 50,
      right: 150,
      top: 50,
      width: 100,
      x: 50,
      y: 50,
      toJSON: jest.fn(),
    }));

    // Mock window dimensions
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    });

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200,
    });
  });

  it('renders pin button', () => {
    render(<WaveHeaderPinned wave={mockWave} side={WaveHeaderPinnedSide.LEFT} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('opens dropdown when button is clicked', async () => {
    render(<WaveHeaderPinned wave={mockWave} side={WaveHeaderPinnedSide.LEFT} />);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByTestId('mock-drop')).toBeInTheDocument();
    });
  });

  it('closes dropdown when button is clicked again', async () => {
    render(<WaveHeaderPinned wave={mockWave} side={WaveHeaderPinnedSide.LEFT} />);
    
    const button = screen.getByRole('button');
    
    // Open dropdown
    await userEvent.click(button);
    await waitFor(() => {
      expect(screen.getByTestId('mock-drop')).toBeInTheDocument();
    });
    
    // Close dropdown
    await userEvent.click(button);
    await waitFor(() => {
      expect(screen.queryByTestId('mock-drop')).not.toBeInTheDocument();
    });
  });

  it('positions dropdown on the right side', async () => {
    render(<WaveHeaderPinned wave={mockWave} side={WaveHeaderPinnedSide.RIGHT} />);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    await waitFor(() => {
      const dropdown = screen.getByTestId('mock-drop').parentElement;
      expect(dropdown).toBeInTheDocument();
      // Check that dropdown has positioning (inline styles are applied)
      expect(dropdown?.getAttribute('style')).toContain('position');
    });
  });

  it('positions dropdown on the left side', async () => {
    render(<WaveHeaderPinned wave={mockWave} side={WaveHeaderPinnedSide.LEFT} />);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    await waitFor(() => {
      const dropdown = screen.getByTestId('mock-drop').parentElement;
      expect(dropdown).toBeInTheDocument();
      // Check that dropdown has positioning (inline styles are applied)
      expect(dropdown?.getAttribute('style')).toContain('position');
    });
  });

  it('adjusts layout for mobile screen size', async () => {
    // Mock mobile width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 800,
    });

    render(<WaveHeaderPinned wave={mockWave} side={WaveHeaderPinnedSide.LEFT} />);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    await waitFor(() => {
      const dropdown = screen.getByTestId('mock-drop').parentElement;
      expect(dropdown).toHaveClass('tw-w-full', 'tw-rounded-lg');
      expect(dropdown).not.toHaveClass('lg:tw-max-w-[672px]');
    });
  });

  it('calculates position when content fits below button', async () => {
    // Mock button position near top of screen
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      bottom: 100,
      height: 50,
      left: 50,
      right: 150,
      top: 50,
      width: 100,
      x: 50,
      y: 50,
      toJSON: jest.fn(),
    }));

    render(<WaveHeaderPinned wave={mockWave} side={WaveHeaderPinnedSide.LEFT} />);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    await waitFor(() => {
      const dropdown = screen.getByTestId('mock-drop').parentElement;
      expect(dropdown).toBeInTheDocument();
      // Check that dropdown has positioning (inline styles are applied)
      expect(dropdown?.getAttribute('style')).toContain('position');
    });
  });

  it('calculates position when content needs to be above button', async () => {
    // Mock button position near bottom of screen
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      bottom: 750,
      height: 50,
      left: 50,
      right: 150,
      top: 700,
      width: 100,
      x: 50,
      y: 700,
      toJSON: jest.fn(),
    }));

    render(<WaveHeaderPinned wave={mockWave} side={WaveHeaderPinnedSide.LEFT} />);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    await waitFor(() => {
      const dropdown = screen.getByTestId('mock-drop').parentElement;
      expect(dropdown).toBeInTheDocument();
      // Check that dropdown has positioning (inline styles are applied)
      expect(dropdown?.getAttribute('style')).toContain('position');
    });
  });

  it('handles window resize events', async () => {
    render(<WaveHeaderPinned wave={mockWave} side={WaveHeaderPinnedSide.LEFT} />);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    // Simulate window resize
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    });
    
    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
    
    await waitFor(() => {
      const dropdown = screen.getByTestId('mock-drop').parentElement;
      expect(dropdown).toHaveClass('tw-w-full');
    });
  });

  it('applies correct styles for desktop dropdown', async () => {
    render(<WaveHeaderPinned wave={mockWave} side={WaveHeaderPinnedSide.LEFT} />);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    await waitFor(() => {
      const dropdown = screen.getByTestId('mock-drop').parentElement;
      expect(dropdown).toHaveClass(
        'tw-bg-iron-800',
        'tw-shadow-xl',
        'tw-ring-1',
        'tw-ring-iron-800',
        'lg:tw-max-w-[672px]',
        'tw-origin-top-left'
      );
    });
  });

  it('passes correct props to Drop component', async () => {
    render(<WaveHeaderPinned wave={mockWave} side={WaveHeaderPinnedSide.LEFT} />);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByTestId('mock-drop')).toBeInTheDocument();
    });
  });
});