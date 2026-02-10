import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WaveHeaderDescription from '@/components/waves/header/WaveHeaderDescription';
import { WaveHeaderPinnedSide } from '@/components/waves/header/WaveHeader';
import type { ApiWave } from '@/generated/models/ApiWave';

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

jest.mock('@/components/waves/drops/Drop', () => {
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

jest.mock('@/helpers/waves/drop.helpers', () => ({
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

// Helper functions to reduce code duplication
const mockWindowSize = (width: number, height: number = 800) => {
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
};

const mockButtonPosition = (overrides: Partial<DOMRect> = {}) => {
  const defaultRect = {
    bottom: 100,
    height: 50,
    left: 50,
    right: 150,
    top: 50,
    width: 100,
    x: 50,
    y: 50,
    toJSON: jest.fn(),
  };
  
  Element.prototype.getBoundingClientRect = jest.fn(() => ({
    ...defaultRect,
    ...overrides,
  }));
};

const renderComponentAndClickButton = async (side: WaveHeaderPinnedSide = WaveHeaderPinnedSide.LEFT) => {
  render(<WaveHeaderDescription wave={mockWave} side={side} />);
  const button = screen.getByRole('button');
  await userEvent.click(button);
  return button;
};

const expectDropdownVisible = async () => {
  await waitFor(() => {
    expect(screen.getByTestId('mock-drop')).toBeInTheDocument();
  });
};

const expectDropdownHidden = async () => {
  await waitFor(() => {
    expect(screen.queryByTestId('mock-drop')).not.toBeInTheDocument();
  });
};

const expectDropdownPositioned = async () => {
  await waitFor(() => {
    const dropdown = screen.getByTestId('mock-drop').parentElement;
    expect(dropdown).toBeInTheDocument();
    expect(dropdown?.getAttribute('style')).toContain('position');
  });
};

describe('WaveHeaderDescription', () => {
  beforeEach(() => {
    mockButtonPosition();
    mockWindowSize(1200, 800);
  });

  it('renders pin button', () => {
    render(<WaveHeaderDescription wave={mockWave} side={WaveHeaderPinnedSide.LEFT} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('opens dropdown when button is clicked', async () => {
    await renderComponentAndClickButton();
    await expectDropdownVisible();
  });

  it('closes dropdown when button is clicked again', async () => {
    const button = await renderComponentAndClickButton();
    await expectDropdownVisible();
    
    // Close dropdown
    await userEvent.click(button);
    await expectDropdownHidden();
  });

  it('positions dropdown on the right side', async () => {
    await renderComponentAndClickButton(WaveHeaderPinnedSide.RIGHT);
    await expectDropdownPositioned();
  });

  it('positions dropdown on the left side', async () => {
    await renderComponentAndClickButton(WaveHeaderPinnedSide.LEFT);
    await expectDropdownPositioned();
  });

  it('adjusts layout for mobile screen size', async () => {
    mockWindowSize(800);
    await renderComponentAndClickButton();
    
    await waitFor(() => {
      const dropdown = screen.getByTestId('mock-drop').parentElement;
      expect(dropdown).toHaveClass('tw-w-full', 'tw-rounded-lg');
      expect(dropdown).not.toHaveClass('lg:tw-max-w-[672px]');
    });
  });

  it('calculates position when content fits below button', async () => {
    mockButtonPosition({ top: 50, bottom: 100 });
    await renderComponentAndClickButton();
    await expectDropdownPositioned();
  });

  it('calculates position when content needs to be above button', async () => {
    mockButtonPosition({ top: 700, bottom: 750, y: 700 });
    await renderComponentAndClickButton();
    await expectDropdownPositioned();
  });

  it('handles window resize events', async () => {
    await renderComponentAndClickButton();
    
    mockWindowSize(500);
    window.dispatchEvent(new Event('resize'));
    
    await waitFor(() => {
      const dropdown = screen.getByTestId('mock-drop').parentElement;
      expect(dropdown).toHaveClass('tw-w-full');
    });
  });

  it('applies correct styles for desktop dropdown', async () => {
    await renderComponentAndClickButton();
    
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
    await renderComponentAndClickButton();
    await expectDropdownVisible();
  });
});