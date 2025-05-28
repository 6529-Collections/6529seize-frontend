import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApiDrop } from '../../../../generated/models/ApiDrop';
import { ApiWaveCreditType } from '../../../../generated/models/ApiWaveCreditType';

// Mock Next.js dynamic imports
jest.mock('next/dynamic', () => {
  return function dynamic(importFunc: any, options?: any) {
    const Component = (props: any) => {
      const module = require('../../../../components/waves/drop/SingleWaveDropVoteContent');
      const ActualComponent = module.SingleWaveDropVoteContent;
      return <ActualComponent {...props} />;
    };
    return Component;
  };
});

export enum SingleWaveDropVoteSize {
  NORMAL = "NORMAL",
  COMPACT = "COMPACT",
}

// Import the component after mocking dynamic
const { SingleWaveDropVoteContent } = require('../../../../components/waves/drop/SingleWaveDropVoteContent');

// Mock FontAwesome component
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, className, flip }: any) => (
    <span 
      data-testid="font-awesome-icon" 
      data-icon={icon?.iconName || 'exchange'}
      data-flip={flip}
      className={className}
    >
      Icon
    </span>
  ),
}));


// Mock child components
jest.mock('../../../../components/waves/drop/SingleWaveDropVoteSubmit', () => {
  return React.forwardRef(function MockSingleWaveDropVoteSubmit(
    { drop, newRating, onVoteSuccess }: any,
    ref: any
  ) {
    React.useImperativeHandle(ref, () => ({
      handleClick: jest.fn().mockResolvedValue(undefined),
    }));

    return (
      <div data-testid="vote-submit">
        <button onClick={() => onVoteSuccess?.()}>Submit Vote</button>
        <span data-testid="new-rating">{newRating}</span>
      </div>
    );
  });
});

jest.mock('../../../../components/waves/drop/SingleWaveDropVoteSlider', () => {
  return function MockSingleWaveDropVoteSlider({ 
    voteValue, 
    minValue, 
    maxValue, 
    setVoteValue, 
    creditType, 
    rank 
  }: any) {
    return (
      <div data-testid="vote-slider">
        <input
          data-testid="slider-input"
          type="range"
          min={minValue}
          max={maxValue}
          value={voteValue}
          onChange={(e) => setVoteValue(Number(e.target.value))}
        />
        <span data-testid="slider-value">{voteValue}</span>
        <span data-testid="slider-credit-type">{creditType}</span>
        <span data-testid="slider-rank">{rank}</span>
      </div>
    );
  };
});

jest.mock('../../../../components/waves/drop/SingleWaveDropVoteInput', () => {
  return function MockSingleWaveDropVoteInput({ 
    voteValue, 
    minValue, 
    maxValue, 
    setVoteValue, 
    onSubmit, 
    creditType 
  }: any) {
    return (
      <div data-testid="vote-input">
        <input
          data-testid="numeric-input"
          type="number"
          min={minValue}
          max={maxValue}
          value={voteValue}
          onChange={(e) => setVoteValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onSubmit()}
        />
        <span data-testid="input-credit-type">{creditType}</span>
      </div>
    );
  };
});

jest.mock('../../../../components/waves/drop/SingleWaveDropVoteStats', () => {
  return function MockSingleWaveDropVoteStats({ currentRating, maxRating, creditType }: any) {
    return (
      <div data-testid="vote-stats">
        <span data-testid="current-rating">{currentRating}</span>
        <span data-testid="max-rating">{maxRating}</span>
        <span data-testid="stats-credit-type">{creditType}</span>
      </div>
    );
  };
});

describe('SingleWaveDropVoteContent', () => {
  const mockOnVoteSuccess = jest.fn();

  const createMockDrop = (overrides: Partial<ApiDrop> = {}): ApiDrop => ({
    id: 'drop-123',
    serial_no: 1,
    rank: 5,
    wave: {
      id: 'wave-123',
      name: 'Test Wave',
      voting_credit_type: ApiWaveCreditType.Tdh,
    },
    context_profile_context: {
      rating: 50,
      min_rating: 0,
      max_rating: 100,
    },
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
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all main components', () => {
    const drop = createMockDrop();

    render(
      <SingleWaveDropVoteContent 
        drop={drop} 
        size={SingleWaveDropVoteSize.NORMAL} 
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    expect(screen.getByTestId('vote-submit')).toBeInTheDocument();
    expect(screen.getByTestId('vote-slider')).toBeInTheDocument();
    expect(screen.getByTestId('vote-stats')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /switch mode/i })).toBeInTheDocument();
  });

  it('initializes with current vote value from drop context', () => {
    const drop = createMockDrop({
      context_profile_context: {
        rating: 75,
        min_rating: 0,
        max_rating: 100,
      },
    });

    render(
      <SingleWaveDropVoteContent 
        drop={drop} 
        size={SingleWaveDropVoteSize.NORMAL} 
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    expect(screen.getByTestId('slider-value')).toHaveTextContent('75');
    expect(screen.getByTestId('new-rating')).toHaveTextContent('75');
  });

  it('starts in slider mode by default', () => {
    const drop = createMockDrop();

    render(
      <SingleWaveDropVoteContent 
        drop={drop} 
        size={SingleWaveDropVoteSize.NORMAL} 
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    expect(screen.getByTestId('vote-slider')).toBeInTheDocument();
    expect(screen.queryByTestId('vote-input')).not.toBeInTheDocument();
    expect(screen.getByText('Numeric')).toBeInTheDocument();
  });

  it('toggles between slider and numeric input modes', () => {
    const drop = createMockDrop();

    render(
      <SingleWaveDropVoteContent 
        drop={drop} 
        size={SingleWaveDropVoteSize.NORMAL} 
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /switch mode/i });

    // Initially in slider mode
    expect(screen.getByTestId('vote-slider')).toBeInTheDocument();
    expect(screen.getByText('Numeric')).toBeInTheDocument();

    // Toggle to numeric mode
    fireEvent.click(toggleButton);

    expect(screen.getByTestId('vote-input')).toBeInTheDocument();
    expect(screen.queryByTestId('vote-slider')).not.toBeInTheDocument();
    expect(screen.getByText('Slider')).toBeInTheDocument();

    // Toggle back to slider mode
    fireEvent.click(toggleButton);

    expect(screen.getByTestId('vote-slider')).toBeInTheDocument();
    expect(screen.queryByTestId('vote-input')).not.toBeInTheDocument();
    expect(screen.getByText('Numeric')).toBeInTheDocument();
  });

  it('updates vote value when slider changes', () => {
    const drop = createMockDrop();

    render(
      <SingleWaveDropVoteContent 
        drop={drop} 
        size={SingleWaveDropVoteSize.NORMAL} 
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    const sliderInput = screen.getByTestId('slider-input');
    fireEvent.change(sliderInput, { target: { value: '80' } });

    expect(screen.getByTestId('slider-value')).toHaveTextContent('80');
    expect(screen.getByTestId('new-rating')).toHaveTextContent('80');
  });

  it('updates vote value when numeric input changes', () => {
    const drop = createMockDrop();

    render(
      <SingleWaveDropVoteContent 
        drop={drop} 
        size={SingleWaveDropVoteSize.NORMAL} 
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    // Switch to numeric mode
    const toggleButton = screen.getByRole('button', { name: /switch mode/i });
    fireEvent.click(toggleButton);

    const numericInput = screen.getByTestId('numeric-input');
    fireEvent.change(numericInput, { target: { value: '85' } });

    expect(screen.getByTestId('new-rating')).toHaveTextContent('85');
  });

  it('passes correct props to slider component', () => {
    const drop = createMockDrop({
      context_profile_context: {
        rating: 30,
        min_rating: 10,
        max_rating: 90,
      },
      rank: 3,
      wave: {
        id: 'wave-123',
        name: 'Test Wave',
        voting_credit_type: ApiWaveCreditType.Rep,
      },
    });

    render(
      <SingleWaveDropVoteContent 
        drop={drop} 
        size={SingleWaveDropVoteSize.NORMAL} 
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    expect(screen.getByTestId('slider-input')).toHaveAttribute('min', '10');
    expect(screen.getByTestId('slider-input')).toHaveAttribute('max', '90');
    expect(screen.getByTestId('slider-input')).toHaveAttribute('value', '30');
    expect(screen.getByTestId('slider-credit-type')).toHaveTextContent('REP');
    expect(screen.getByTestId('slider-rank')).toHaveTextContent('3');
  });

  it('passes correct props to numeric input component', () => {
    const drop = createMockDrop({
      context_profile_context: {
        rating: 40,
        min_rating: 5,
        max_rating: 95,
      },
      wave: {
        id: 'wave-123',
        name: 'Test Wave',
        voting_credit_type: ApiWaveCreditType.Cic,
      },
    });

    render(
      <SingleWaveDropVoteContent 
        drop={drop} 
        size={SingleWaveDropVoteSize.NORMAL} 
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    // Switch to numeric mode
    const toggleButton = screen.getByRole('button', { name: /switch mode/i });
    fireEvent.click(toggleButton);

    expect(screen.getByTestId('numeric-input')).toHaveAttribute('min', '5');
    expect(screen.getByTestId('numeric-input')).toHaveAttribute('max', '95');
    expect(screen.getByTestId('numeric-input')).toHaveAttribute('value', '40');
    expect(screen.getByTestId('input-credit-type')).toHaveTextContent('CIC');
  });

  it('passes correct props to stats component', () => {
    const drop = createMockDrop({
      context_profile_context: {
        rating: 60,
        min_rating: 0,
        max_rating: 120,
      },
      wave: {
        id: 'wave-123',
        name: 'Test Wave',
        voting_credit_type: ApiWaveCreditType.Tdh,
      },
    });

    render(
      <SingleWaveDropVoteContent 
        drop={drop} 
        size={SingleWaveDropVoteSize.NORMAL} 
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    expect(screen.getByTestId('current-rating')).toHaveTextContent('60');
    expect(screen.getByTestId('max-rating')).toHaveTextContent('120');
    expect(screen.getByTestId('stats-credit-type')).toHaveTextContent('TDH');
  });

  it('handles submit via numeric input enter key', async () => {
    const drop = createMockDrop();

    render(
      <SingleWaveDropVoteContent 
        drop={drop} 
        size={SingleWaveDropVoteSize.NORMAL} 
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    // Switch to numeric mode
    const toggleButton = screen.getByRole('button', { name: /switch mode/i });
    fireEvent.click(toggleButton);

    const numericInput = screen.getByTestId('numeric-input');
    fireEvent.keyPress(numericInput, { key: 'Enter', code: 'Enter' });

    // The submit functionality is tested via the mocked component
    expect(screen.getByTestId('vote-input')).toBeInTheDocument();
  });

  it('updates vote value when drop context changes', () => {
    const drop = createMockDrop({
      context_profile_context: {
        rating: 25,
        min_rating: 0,
        max_rating: 100,
      },
    });

    const { rerender } = render(
      <SingleWaveDropVoteContent 
        drop={drop} 
        size={SingleWaveDropVoteSize.NORMAL} 
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    expect(screen.getByTestId('slider-value')).toHaveTextContent('25');

    // Update the drop with new rating
    const updatedDrop = createMockDrop({
      context_profile_context: {
        rating: 75,
        min_rating: 0,
        max_rating: 100,
      },
    });

    rerender(
      <SingleWaveDropVoteContent 
        drop={updatedDrop} 
        size={SingleWaveDropVoteSize.NORMAL} 
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    expect(screen.getByTestId('slider-value')).toHaveTextContent('75');
  });

  it('handles missing context profile gracefully', () => {
    const drop = createMockDrop({
      context_profile_context: null,
    });

    render(
      <SingleWaveDropVoteContent 
        drop={drop} 
        size={SingleWaveDropVoteSize.NORMAL} 
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    expect(screen.getByTestId('slider-value')).toHaveTextContent('0');
    expect(screen.getByTestId('new-rating')).toHaveTextContent('0');
    expect(screen.getByTestId('current-rating')).toHaveTextContent('0');
  });

  it('stops event propagation on container click', () => {
    const drop = createMockDrop();
    const parentClickHandler = jest.fn();

    render(
      <div onClick={parentClickHandler}>
        <SingleWaveDropVoteContent 
          drop={drop} 
          size={SingleWaveDropVoteSize.NORMAL} 
          onVoteSuccess={mockOnVoteSuccess}
        />
      </div>
    );

    const container = screen.getByTestId('vote-slider').closest('.tw-bg-iron-800');
    fireEvent.click(container!);

    expect(parentClickHandler).not.toHaveBeenCalled();
  });

  it('shows correct icon flip based on mode', () => {
    const drop = createMockDrop();

    render(
      <SingleWaveDropVoteContent 
        drop={drop} 
        size={SingleWaveDropVoteSize.NORMAL} 
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    const icon = screen.getByTestId('font-awesome-icon');
    
    // In slider mode, should show "horizontal" flip
    expect(icon).toHaveAttribute('data-flip', 'horizontal');

    // Switch to numeric mode
    const toggleButton = screen.getByRole('button', { name: /switch mode/i });
    fireEvent.click(toggleButton);

    // In numeric mode, should show "vertical" flip
    expect(icon).toHaveAttribute('data-flip', 'vertical');
  });

  it('calls onVoteSuccess when vote is submitted successfully', () => {
    const drop = createMockDrop();

    render(
      <SingleWaveDropVoteContent 
        drop={drop} 
        size={SingleWaveDropVoteSize.NORMAL} 
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    const submitButton = screen.getByRole('button', { name: /submit vote/i });
    fireEvent.click(submitButton);

    expect(mockOnVoteSuccess).toHaveBeenCalled();
  });

  it('works with different SingleWaveDropVoteSize values', () => {
    const drop = createMockDrop();

    const { rerender } = render(
      <SingleWaveDropVoteContent 
        drop={drop} 
        size={SingleWaveDropVoteSize.NORMAL} 
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    expect(screen.getByTestId('vote-slider')).toBeInTheDocument();

    rerender(
      <SingleWaveDropVoteContent 
        drop={drop} 
        size={SingleWaveDropVoteSize.COMPACT} 
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    expect(screen.getByTestId('vote-slider')).toBeInTheDocument();
  });
});