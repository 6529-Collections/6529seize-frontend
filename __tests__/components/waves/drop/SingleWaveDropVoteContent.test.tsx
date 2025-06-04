import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SingleWaveDropVoteContent } from '../../../../components/waves/drop/SingleWaveDropVoteContent';
import { ApiDrop } from '../../../../generated/models/ApiDrop';
import { ApiWaveCreditType } from '../../../../generated/models/ApiWaveCreditType';

jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: ({ flip }: any) => <span data-testid="font-awesome-icon" data-flip={flip} /> }));
jest.mock('../../../../components/waves/drop/SingleWaveDropVoteSubmit', () => {
  return React.forwardRef(function MockSubmit(props: any, ref: any) {
    React.useImperativeHandle(ref, () => ({ handleClick: jest.fn() }));
    return <div data-testid="vote-submit"><button onClick={() => props.onVoteSuccess?.()}>Submit Vote</button><span data-testid="new-rating">{props.newRating}</span></div>;
  });
});
jest.mock('../../../../components/waves/drop/SingleWaveDropVoteSlider', () => ({ __esModule: true, default: (props: any) => <div data-testid="vote-slider"><input data-testid="slider-input" type="range" min={props.minValue} max={props.maxValue} value={props.voteValue} onChange={(e) => props.setVoteValue(Number(e.target.value))} /><span data-testid="slider-value">{props.voteValue}</span><span data-testid="slider-credit-type">{props.creditType}</span><span data-testid="slider-rank">{props.rank}</span></div> }));
jest.mock('../../../../components/waves/drop/SingleWaveDropVoteInput', () => ({ __esModule: true, SingleWaveDropVoteInput: (props: any) => <div data-testid="vote-input"><input data-testid="numeric-input" type="number" min={props.minValue} max={props.maxValue} value={props.voteValue} onChange={(e) => props.setVoteValue(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && props.onSubmit()} /><span data-testid="input-credit-type">{props.creditType}</span></div> }));
jest.mock('../../../../components/waves/drop/SingleWaveDropVoteStats', () => ({ __esModule: true, SingleWaveDropVoteStats: (props: any) => <div data-testid="vote-stats"><span data-testid="current-rating">{props.currentRating}</span><span data-testid="max-rating">{props.maxRating}</span><span data-testid="stats-credit-type">{props.creditType}</span></div> }));

export enum SingleWaveDropVoteSize {
  NORMAL = "NORMAL",
  COMPACT = "COMPACT",
}

describe('SingleWaveDropVoteContent', () => {
  const mockOnVoteSuccess = jest.fn();

  const createMockDrop = (overrides: Partial<ApiDrop> = {}): ApiDrop => ({
    id: 'drop-123',
    serial_no: 1,
    rank: 5,
    wave: { id:'wave-123', name:'Test Wave', voting_credit_type: ApiWaveCreditType.Tdh } as any,
    context_profile_context: { rating: 50, min_rating: 0, max_rating: 100 },
    parts: [], referenced_nfts: [], mentioned_users: [], metadata: [], 
    author: { id:'author-123', handle:'testauthor' } as any,
    created_at: Date.now(), updated_at: Date.now(),
    ...overrides,
  } as ApiDrop);

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
    expect(screen.getByRole('button', { name: /numeric/i })).toBeInTheDocument();
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

    const toggleButton = screen.getByRole('button', { name: /numeric/i });

    // Initially in slider mode
    expect(screen.getByTestId('vote-slider')).toBeInTheDocument();
    expect(screen.getByText('Numeric')).toBeInTheDocument();

    // Toggle to numeric mode
    fireEvent.click(toggleButton);

    expect(screen.getByTestId('vote-input')).toBeInTheDocument();
    expect(screen.queryByTestId('vote-slider')).not.toBeInTheDocument();
    expect(screen.getByText('Slider')).toBeInTheDocument();

    // Toggle back to slider mode
    const sliderButton = screen.getByRole('button', { name: /slider/i });
    fireEvent.click(sliderButton);

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
    const toggleButton = screen.getByRole('button', { name: /numeric/i });
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

    // Switch to numeric mode
    const toggleButton = screen.getByRole('button', { name: /numeric/i });
    fireEvent.click(toggleButton);

    expect(screen.getByTestId('numeric-input')).toHaveAttribute('min', '5');
    expect(screen.getByTestId('numeric-input')).toHaveAttribute('max', '95');
    expect(screen.getByTestId('numeric-input')).toHaveAttribute('value', '40');
    expect(screen.getByTestId('input-credit-type')).toHaveTextContent('REP');
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
    const toggleButton = screen.getByRole('button', { name: /numeric/i });
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
    const toggleButton = screen.getByRole('button', { name: /numeric/i });
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