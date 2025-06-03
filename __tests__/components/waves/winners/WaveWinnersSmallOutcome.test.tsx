import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WaveWinnersSmallOutcome } from '../../../../components/waves/winners/WaveWinnersSmallOutcome';
import { ApiWave } from '../../../../generated/models/ApiWave';
import { ExtendedDrop } from '../../../../helpers/waves/drop.helpers';

// Mock external dependencies
jest.mock('@tippyjs/react', () => {
  return function MockTippy({ 
    children, 
    content, 
    visible, 
    onClickOutside 
  }: any) {
    const [isVisible, setIsVisible] = React.useState(false);
    
    React.useEffect(() => {
      if (visible !== undefined) {
        setIsVisible(visible);
      }
    }, [visible]);

    return (
      <div data-testid="tippy-container">
        <div 
          onClick={() => setIsVisible(!isVisible)}
          onBlur={() => {
            setIsVisible(false);
            onClickOutside?.();
          }}
        >
          {children}
        </div>
        {isVisible && (
          <div data-testid="tippy-content">
            {content}
          </div>
        )}
      </div>
    );
  };
});

jest.mock('../../../../hooks/drops/useDropOutcomes', () => ({
  useDropOutcomes: jest.fn(),
}));

jest.mock('../../../../helpers/Helpers', () => ({
  formatNumberWithCommas: jest.fn((num) => num.toLocaleString()),
}));

import { useDropOutcomes } from '../../../../hooks/drops/useDropOutcomes';

const mockedUseDropOutcomes = useDropOutcomes as jest.Mock;

describe('WaveWinnersSmallOutcome', () => {
  const mockWave: ApiWave = {
    id: 'wave-123',
    name: 'Test Wave',
    description_drop: null,
    outcomes: [],
    voting_credit_type: 'TDH',
    created_at: Date.now(),
    updated_at: Date.now(),
  };

  const mockDrop: ExtendedDrop = {
    id: 'drop-123',
    serial_no: 1,
    wave: mockWave,
    author: {
      id: 'author-123',
      handle: 'testauthor',
      normalised_handle: 'testauthor',
      primary_wallet: '0x123',
      pfp: null,
      cic: { rating: 100, contributor_count: 5 },
      rep: { rating: 200, contributor_count: 10 },
      tdh: 1000,
      level: 5,
      classification: 'HUMAN',
      sub_classification: null,
      created_at: Date.now(),
    },
    parts: [],
    referenced_nfts: [],
    mentioned_users: [],
    metadata: [],
    created_at: Date.now(),
    updated_at: Date.now(),
  };

  const mockOutcomesWithNIC = {
    nicOutcomes: [{ value: 1000 }, { value: 500 }],
    repOutcomes: [],
    manualOutcomes: [],
  };

  const mockOutcomesWithRep = {
    nicOutcomes: [],
    repOutcomes: [
      { value: 200, category: 'Art' },
      { value: 150, category: 'Music' },
    ],
    manualOutcomes: [],
  };

  const mockOutcomesWithManual = {
    nicOutcomes: [],
    repOutcomes: [],
    manualOutcomes: [
      { description: 'Special Award' },
      { description: 'Community Choice' },
    ],
  };

  const mockMixedOutcomes = {
    nicOutcomes: [{ value: 750 }],
    repOutcomes: [{ value: 100, category: 'Innovation' }],
    manualOutcomes: [{ description: 'Breakthrough' }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock touch detection
    Object.defineProperty(window, 'ontouchstart', {
      writable: true,
      value: undefined,
    });
  });

  it('returns null when there are no outcomes', () => {
    mockedUseDropOutcomes.mockReturnValue({
      outcomes: {
        nicOutcomes: [],
        repOutcomes: [],
        manualOutcomes: [],
      },
      haveOutcomes: false,
    });

    const { container } = render(
      <WaveWinnersSmallOutcome drop={mockDrop} wave={mockWave} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders outcome button when outcomes exist', () => {
    mockedUseDropOutcomes.mockReturnValue({
      outcomes: mockOutcomesWithNIC,
      haveOutcomes: true,
    });

    render(<WaveWinnersSmallOutcome drop={mockDrop} wave={mockWave} />);

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Outcome:')).toBeInTheDocument();
  });

  it('displays NIC icon when NIC outcomes exist', () => {
    mockedUseDropOutcomes.mockReturnValue({
      outcomes: mockOutcomesWithNIC,
      haveOutcomes: true,
    });

    render(<WaveWinnersSmallOutcome drop={mockDrop} wave={mockWave} />);

    // Check for NIC icon (should have specific path for document icon)
    const nicIcon = document.querySelector('svg[class*="tw-text-[#A4C2DB]"]');
    expect(nicIcon).toBeInTheDocument();
  });

  it('displays Rep icon when Rep outcomes exist', () => {
    mockedUseDropOutcomes.mockReturnValue({
      outcomes: mockOutcomesWithRep,
      haveOutcomes: true,
    });

    render(<WaveWinnersSmallOutcome drop={mockDrop} wave={mockWave} />);

    // Check for Rep icon (should have specific path for star icon)
    const repIcon = document.querySelector('svg[class*="tw-text-[#C3B5D9]"]');
    expect(repIcon).toBeInTheDocument();
  });

  it('displays Manual icon when manual outcomes exist', () => {
    mockedUseDropOutcomes.mockReturnValue({
      outcomes: mockOutcomesWithManual,
      haveOutcomes: true,
    });

    render(<WaveWinnersSmallOutcome drop={mockDrop} wave={mockWave} />);

    // Check for Manual icon (should have specific path for badge icon)
    const manualIcon = document.querySelector('svg[class*="tw-text-[#D4C5AA]"]');
    expect(manualIcon).toBeInTheDocument();
  });

  it('displays multiple icons when multiple outcome types exist', () => {
    mockedUseDropOutcomes.mockReturnValue({
      outcomes: mockMixedOutcomes,
      haveOutcomes: true,
    });

    render(<WaveWinnersSmallOutcome drop={mockDrop} wave={mockWave} />);

    const nicIcon = document.querySelector('svg[class*="tw-text-[#A4C2DB]"]');
    const repIcon = document.querySelector('svg[class*="tw-text-[#C3B5D9]"]');
    const manualIcon = document.querySelector('svg[class*="tw-text-[#D4C5AA]"]');

    expect(nicIcon).toBeInTheDocument();
    expect(repIcon).toBeInTheDocument();
    expect(manualIcon).toBeInTheDocument();
  });

  it('shows tooltip content with NIC outcomes', () => {
    mockedUseDropOutcomes.mockReturnValue({
      outcomes: mockOutcomesWithNIC,
      haveOutcomes: true,
    });

    render(<WaveWinnersSmallOutcome drop={mockDrop} wave={mockWave} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByTestId('tippy-content')).toBeInTheDocument();
    expect(screen.getByText('Outcome Details')).toBeInTheDocument();
    expect(screen.getAllByText('NIC')).toHaveLength(2);
    expect(screen.getByText('1,000')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('shows tooltip content with Rep outcomes', () => {
    mockedUseDropOutcomes.mockReturnValue({
      outcomes: mockOutcomesWithRep,
      haveOutcomes: true,
    });

    render(<WaveWinnersSmallOutcome drop={mockDrop} wave={mockWave} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByTestId('tippy-content')).toBeInTheDocument();
    expect(screen.getAllByText('Rep')).toHaveLength(2);
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('Art')).toBeInTheDocument();
    expect(screen.getByText('Music')).toBeInTheDocument();
  });

  it('shows tooltip content with manual outcomes', () => {
    mockedUseDropOutcomes.mockReturnValue({
      outcomes: mockOutcomesWithManual,
      haveOutcomes: true,
    });

    render(<WaveWinnersSmallOutcome drop={mockDrop} wave={mockWave} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByTestId('tippy-content')).toBeInTheDocument();
    expect(screen.getByText('Special Award')).toBeInTheDocument();
    expect(screen.getByText('Community Choice')).toBeInTheDocument();
  });

  it('detects touch device and handles touch interactions', () => {
    // Mock touch device
    Object.defineProperty(window, 'ontouchstart', {
      writable: true,
      value: true,
    });

    mockedUseDropOutcomes.mockReturnValue({
      outcomes: mockOutcomesWithNIC,
      haveOutcomes: true,
    });

    render(<WaveWinnersSmallOutcome drop={mockDrop} wave={mockWave} />);

    const button = screen.getByRole('button');
    
    // First click should open tooltip
    fireEvent.click(button);
    expect(screen.getByTestId('tippy-content')).toBeInTheDocument();

    // Second click should close tooltip
    fireEvent.click(button);
    expect(screen.queryByTestId('tippy-content')).not.toBeInTheDocument();
  });

  it('stops event propagation on button click', () => {
    const parentClickHandler = jest.fn();
    
    mockedUseDropOutcomes.mockReturnValue({
      outcomes: mockOutcomesWithNIC,
      haveOutcomes: true,
    });

    render(
      <div onClick={parentClickHandler}>
        <WaveWinnersSmallOutcome drop={mockDrop} wave={mockWave} />
      </div>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(parentClickHandler).not.toHaveBeenCalled();
  });

  it('handles onClickOutside for tooltip', () => {
    mockedUseDropOutcomes.mockReturnValue({
      outcomes: mockOutcomesWithNIC,
      haveOutcomes: true,
    });

    render(<WaveWinnersSmallOutcome drop={mockDrop} wave={mockWave} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByTestId('tippy-content')).toBeInTheDocument();

    // Simulate clicking outside
    const tippyContainer = screen.getByTestId('tippy-container');
    const childDiv = tippyContainer.firstChild as HTMLElement;
    fireEvent.blur(childDiv);

    expect(screen.queryByTestId('tippy-content')).not.toBeInTheDocument();
  });

  it('passes correct props to useDropOutcomes hook', () => {
    mockedUseDropOutcomes.mockReturnValue({
      outcomes: mockOutcomesWithNIC,
      haveOutcomes: true,
    });

    render(<WaveWinnersSmallOutcome drop={mockDrop} wave={mockWave} />);

    expect(mockedUseDropOutcomes).toHaveBeenCalledWith({
      drop: mockDrop,
      wave: mockWave,
    });
  });

  it('formats numbers correctly in tooltip', () => {
    const formatNumberWithCommas = require('../../../../helpers/Helpers').formatNumberWithCommas;
    formatNumberWithCommas.mockImplementation((num: number) => num.toLocaleString());

    mockedUseDropOutcomes.mockReturnValue({
      outcomes: {
        nicOutcomes: [{ value: 1234567 }],
        repOutcomes: [],
        manualOutcomes: [],
      },
      haveOutcomes: true,
    });

    render(<WaveWinnersSmallOutcome drop={mockDrop} wave={mockWave} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(formatNumberWithCommas).toHaveBeenCalledWith(1234567);
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });

  it('handles mixed outcomes correctly in tooltip', () => {
    mockedUseDropOutcomes.mockReturnValue({
      outcomes: mockMixedOutcomes,
      haveOutcomes: true,
    });

    render(<WaveWinnersSmallOutcome drop={mockDrop} wave={mockWave} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Should show all outcome types in tooltip
    expect(screen.getByText('NIC')).toBeInTheDocument();
    expect(screen.getByText('Rep')).toBeInTheDocument();
    expect(screen.getByText('Innovation')).toBeInTheDocument();
    expect(screen.getByText('Breakthrough')).toBeInTheDocument();
    expect(screen.getByText('750')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('has correct CSS classes for styling', () => {
    mockedUseDropOutcomes.mockReturnValue({
      outcomes: mockOutcomesWithNIC,
      haveOutcomes: true,
    });

    render(<WaveWinnersSmallOutcome drop={mockDrop} wave={mockWave} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass(
      'tw-border-0',
      'tw-rounded-lg',
      'tw-flex',
      'tw-items-center',
      'tw-gap-2',
      'tw-min-w-6',
      'tw-py-1.5',
      'tw-px-2',
      'tw-bg-iron-800',
      'tw-ring-1',
      'tw-ring-iron-700'
    );
  });

  it('updates touch state on component mount', async () => {
    // Test with touch device
    Object.defineProperty(window, 'ontouchstart', {
      writable: true,
      value: true,
    });

    mockedUseDropOutcomes.mockReturnValue({
      outcomes: mockOutcomesWithNIC,
      haveOutcomes: true,
    });

    render(<WaveWinnersSmallOutcome drop={mockDrop} wave={mockWave} />);

    // The component should detect touch and handle interactions accordingly
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // On touch devices, clicking should toggle tooltip visibility
    expect(screen.getByTestId('tippy-content')).toBeInTheDocument();
  });

  it('renders unique keys for outcome items', () => {
    mockedUseDropOutcomes.mockReturnValue({
      outcomes: {
        nicOutcomes: [{ value: 100 }, { value: 200 }],
        repOutcomes: [
          { value: 50, category: 'Art' },
          { value: 75, category: 'Music' },
        ],
        manualOutcomes: [
          { description: 'Award 1' },
          { description: 'Award 2' },
        ],
      },
      haveOutcomes: true,
    });

    render(<WaveWinnersSmallOutcome drop={mockDrop} wave={mockWave} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // All items should render without key conflicts
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('Art')).toBeInTheDocument();
    expect(screen.getByText('Music')).toBeInTheDocument();
    expect(screen.getByText('Award 1')).toBeInTheDocument();
    expect(screen.getByText('Award 2')).toBeInTheDocument();
  });
});
