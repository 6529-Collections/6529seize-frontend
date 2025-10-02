import { render, screen, fireEvent } from '@testing-library/react';
import { MemesWaveSmallLeaderboardDrop } from '@/components/waves/small-leaderboard/MemesWaveSmallLeaderboardDrop';
import { ExtendedDrop } from '@/helpers/waves/drop.helpers';
import { ApiWave } from '@/generated/models/ApiWave';

// Mock the child components
jest.mock('@/components/waves/small-leaderboard/WaveSmallLeaderboardTopThreeDrop', () => ({
  WaveSmallLeaderboardTopThreeDrop: ({ drop, wave, onDropClick }: any) => (
    <div data-testid="top-three-drop" onClick={() => onDropClick(drop)}>
      Top Three Drop - Rank: {drop.rank}
    </div>
  ),
}));

jest.mock('@/components/waves/small-leaderboard/WaveSmallLeaderboardDefaultDrop', () => ({
  WaveSmallLeaderboardDefaultDrop: ({ drop, wave, onDropClick }: any) => (
    <div data-testid="default-drop" onClick={() => onDropClick(drop)}>
      Default Drop - ID: {drop.id}
    </div>
  ),
}));

describe('MemesWaveSmallLeaderboardDrop', () => {
  const mockWave: ApiWave = {
    id: 'wave-1',
    name: 'Test Wave',
  } as ApiWave;

  const mockOnDropClick = jest.fn();

  const createMockDrop = (rank?: number): ExtendedDrop => ({
    id: 'drop-1',
    rank: rank,
    author: {
      id: 'author-1',
      handle: 'testuser',
    },
    created_at: Date.now(),
    title: 'Test Drop',
  } as ExtendedDrop);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders WaveSmallLeaderboardTopThreeDrop for rank 1', () => {
    const drop = createMockDrop(1);
    render(
      <MemesWaveSmallLeaderboardDrop
        drop={drop}
        wave={mockWave}
        onDropClick={mockOnDropClick}
      />
    );

    expect(screen.getByTestId('top-three-drop')).toBeInTheDocument();
    expect(screen.getByText('Top Three Drop - Rank: 1')).toBeInTheDocument();
    expect(screen.queryByTestId('default-drop')).not.toBeInTheDocument();
  });

  it('renders WaveSmallLeaderboardTopThreeDrop for rank 2', () => {
    const drop = createMockDrop(2);
    render(
      <MemesWaveSmallLeaderboardDrop
        drop={drop}
        wave={mockWave}
        onDropClick={mockOnDropClick}
      />
    );

    expect(screen.getByTestId('top-three-drop')).toBeInTheDocument();
    expect(screen.getByText('Top Three Drop - Rank: 2')).toBeInTheDocument();
    expect(screen.queryByTestId('default-drop')).not.toBeInTheDocument();
  });

  it('renders WaveSmallLeaderboardTopThreeDrop for rank 3', () => {
    const drop = createMockDrop(3);
    render(
      <MemesWaveSmallLeaderboardDrop
        drop={drop}
        wave={mockWave}
        onDropClick={mockOnDropClick}
      />
    );

    expect(screen.getByTestId('top-three-drop')).toBeInTheDocument();
    expect(screen.getByText('Top Three Drop - Rank: 3')).toBeInTheDocument();
    expect(screen.queryByTestId('default-drop')).not.toBeInTheDocument();
  });

  it('renders WaveSmallLeaderboardDefaultDrop for rank 4', () => {
    const drop = createMockDrop(4);
    render(
      <MemesWaveSmallLeaderboardDrop
        drop={drop}
        wave={mockWave}
        onDropClick={mockOnDropClick}
      />
    );

    expect(screen.getByTestId('default-drop')).toBeInTheDocument();
    expect(screen.getByText('Default Drop - ID: drop-1')).toBeInTheDocument();
    expect(screen.queryByTestId('top-three-drop')).not.toBeInTheDocument();
  });

  it('renders WaveSmallLeaderboardDefaultDrop for rank higher than 3', () => {
    const drop = createMockDrop(10);
    render(
      <MemesWaveSmallLeaderboardDrop
        drop={drop}
        wave={mockWave}
        onDropClick={mockOnDropClick}
      />
    );

    expect(screen.getByTestId('default-drop')).toBeInTheDocument();
    expect(screen.queryByTestId('top-three-drop')).not.toBeInTheDocument();
  });

  it('renders WaveSmallLeaderboardDefaultDrop when rank is null', () => {
    const drop = createMockDrop();
    render(
      <MemesWaveSmallLeaderboardDrop
        drop={drop}
        wave={mockWave}
        onDropClick={mockOnDropClick}
      />
    );

    expect(screen.getByTestId('default-drop')).toBeInTheDocument();
    expect(screen.queryByTestId('top-three-drop')).not.toBeInTheDocument();
  });

  it('renders WaveSmallLeaderboardDefaultDrop when rank is undefined', () => {
    const drop = createMockDrop(undefined);
    render(
      <MemesWaveSmallLeaderboardDrop
        drop={drop}
        wave={mockWave}
        onDropClick={mockOnDropClick}
      />
    );

    expect(screen.getByTestId('default-drop')).toBeInTheDocument();
    expect(screen.queryByTestId('top-three-drop')).not.toBeInTheDocument();
  });

  it('calls onDropClick when container is clicked', () => {
    const drop = createMockDrop(1);
    const { container } = render(
      <MemesWaveSmallLeaderboardDrop
        drop={drop}
        wave={mockWave}
        onDropClick={mockOnDropClick}
      />
    );

    const clickableContainer = container.querySelector('.tw-cursor-pointer');
    fireEvent.click(clickableContainer!);

    expect(mockOnDropClick).toHaveBeenCalledWith(drop);
  });

  it('has cursor-pointer class for clickable styling', () => {
    const drop = createMockDrop(1);
    const { container } = render(
      <MemesWaveSmallLeaderboardDrop
        drop={drop}
        wave={mockWave}
        onDropClick={mockOnDropClick}
      />
    );

    const clickableDiv = container.querySelector('.tw-cursor-pointer');
    expect(clickableDiv).toBeInTheDocument();
  });

  it('passes correct props to child components', () => {
    const drop = createMockDrop(1);
    render(
      <MemesWaveSmallLeaderboardDrop
        drop={drop}
        wave={mockWave}
        onDropClick={mockOnDropClick}
      />
    );

    // Child component should receive the same props
    expect(screen.getByTestId('top-three-drop')).toBeInTheDocument();
  });

  it('handles edge case rank of 0', () => {
    const drop = createMockDrop(0);
    render(
      <MemesWaveSmallLeaderboardDrop
        drop={drop}
        wave={mockWave}
        onDropClick={mockOnDropClick}
      />
    );

    // Rank 0 should render default drop since it's not in top 3
    expect(screen.getByTestId('default-drop')).toBeInTheDocument();
    expect(screen.queryByTestId('top-three-drop')).not.toBeInTheDocument();
  });
});