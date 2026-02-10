import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DefaultWaveSmallLeaderboardDrop } from '@/components/waves/small-leaderboard/DefaultWaveSmallLeaderboardDrop';
import type { ExtendedDrop } from '@/helpers/waves/drop.helpers';
import type { ApiWave } from '@/generated/models/ApiWave';

// Mock the child components
jest.mock('@/components/waves/small-leaderboard/WaveSmallLeaderboardTopThreeDrop', () => ({
  WaveSmallLeaderboardTopThreeDrop: function({ drop, wave, onDropClick }: any) {
    return (
      <div data-testid="top-three-drop" onClick={() => onDropClick(drop)}>
        Top Three Drop - Rank {drop.rank}
      </div>
    );
  },
}));

jest.mock('@/components/waves/small-leaderboard/WaveSmallLeaderboardDefaultDrop', () => ({
  WaveSmallLeaderboardDefaultDrop: function({ drop, wave, onDropClick }: any) {
    return (
      <div data-testid="default-drop" onClick={() => onDropClick(drop)}>
        Default Drop - Rank {drop.rank || 'No rank'}
      </div>
    );
  },
}));

describe('DefaultWaveSmallLeaderboardDrop', () => {
  const mockOnDropClick = jest.fn();

  const mockWave: ApiWave = {
    id: 'wave-1',
    name: 'Test Wave',
  } as ApiWave;

  const defaultProps = {
    wave: mockWave,
    onDropClick: mockOnDropClick,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (drop: ExtendedDrop, props = {}) => {
    return render(
      <DefaultWaveSmallLeaderboardDrop 
        drop={drop} 
        {...defaultProps} 
        {...props} 
      />
    );
  };

  it('renders top three component for rank 1', async () => {
    const user = userEvent.setup();
    const drop = { id: 'drop-1', rank: 1 } as ExtendedDrop;
    
    renderComponent(drop);
    
    expect(screen.getByTestId('top-three-drop')).toBeInTheDocument();
    expect(screen.getByText('Top Three Drop - Rank 1')).toBeInTheDocument();
    expect(screen.queryByTestId('default-drop')).not.toBeInTheDocument();
  });

  it('renders top three component for rank 2', () => {
    const drop = { id: 'drop-2', rank: 2 } as ExtendedDrop;
    
    renderComponent(drop);
    
    expect(screen.getByTestId('top-three-drop')).toBeInTheDocument();
    expect(screen.getByText('Top Three Drop - Rank 2')).toBeInTheDocument();
  });

  it('renders top three component for rank 3', () => {
    const drop = { id: 'drop-3', rank: 3 } as ExtendedDrop;
    
    renderComponent(drop);
    
    expect(screen.getByTestId('top-three-drop')).toBeInTheDocument();
    expect(screen.getByText('Top Three Drop - Rank 3')).toBeInTheDocument();
  });

  it('renders default component for rank 4', () => {
    const drop = { id: 'drop-4', rank: 4 } as ExtendedDrop;
    
    renderComponent(drop);
    
    expect(screen.getByTestId('default-drop')).toBeInTheDocument();
    expect(screen.getByText('Default Drop - Rank 4')).toBeInTheDocument();
    expect(screen.queryByTestId('top-three-drop')).not.toBeInTheDocument();
  });

  it('renders default component for rank higher than 3', () => {
    const drop = { id: 'drop-10', rank: 10 } as ExtendedDrop;
    
    renderComponent(drop);
    
    expect(screen.getByTestId('default-drop')).toBeInTheDocument();
    expect(screen.getByText('Default Drop - Rank 10')).toBeInTheDocument();
  });

  it('renders default component when rank is null', () => {
    const drop = { id: 'drop-null', rank: null } as ExtendedDrop;
    
    renderComponent(drop);
    
    expect(screen.getByTestId('default-drop')).toBeInTheDocument();
    expect(screen.getByText('Default Drop - Rank No rank')).toBeInTheDocument();
  });

  it('renders default component when rank is undefined', () => {
    const drop = { id: 'drop-undefined' } as ExtendedDrop;
    
    renderComponent(drop);
    
    expect(screen.getByTestId('default-drop')).toBeInTheDocument();
    expect(screen.getByText('Default Drop - Rank No rank')).toBeInTheDocument();
  });

  it('calls onDropClick when container is clicked', async () => {
    const user = userEvent.setup();
    const drop = { id: 'drop-clickable', rank: 5 } as ExtendedDrop;
    
    renderComponent(drop);
    
    const container = screen.getByTestId('default-drop').parentElement;
    await user.click(container!);
    
    expect(mockOnDropClick).toHaveBeenCalledWith(drop);
  });

  it('calls onDropClick when top three drop is clicked', async () => {
    const user = userEvent.setup();
    const drop = { id: 'drop-top-clickable', rank: 2 } as ExtendedDrop;
    
    renderComponent(drop);
    
    await user.click(screen.getByTestId('top-three-drop'));
    
    expect(mockOnDropClick).toHaveBeenCalledWith(drop);
  });

  it('applies cursor pointer class to container', () => {
    const drop = { id: 'drop-cursor', rank: 1 } as ExtendedDrop;
    
    const { container } = renderComponent(drop);
    
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('tw-cursor-pointer');
  });

  it('passes correct props to top three component', () => {
    const drop = { id: 'drop-props', rank: 1 } as ExtendedDrop;
    
    renderComponent(drop);
    
    const topThreeComponent = screen.getByTestId('top-three-drop');
    expect(topThreeComponent).toBeInTheDocument();
    // Props are passed correctly if the component renders with expected content
    expect(screen.getByText('Top Three Drop - Rank 1')).toBeInTheDocument();
  });

  it('passes correct props to default component', () => {
    const drop = { id: 'drop-default-props', rank: 5 } as ExtendedDrop;
    
    renderComponent(drop);
    
    const defaultComponent = screen.getByTestId('default-drop');
    expect(defaultComponent).toBeInTheDocument();
    // Props are passed correctly if the component renders with expected content
    expect(screen.getByText('Default Drop - Rank 5')).toBeInTheDocument();
  });

  it('handles edge case of rank 0', () => {
    const drop = { id: 'drop-zero', rank: 0 } as ExtendedDrop;
    
    renderComponent(drop);
    
    // Rank 0 is falsy in the condition (0 && 0 <= 3), so should use default
    expect(screen.getByTestId('default-drop')).toBeInTheDocument();
    expect(screen.getByText('Default Drop - Rank No rank')).toBeInTheDocument();
  });

  it('handles negative rank values', () => {
    const drop = { id: 'drop-negative', rank: -1 } as ExtendedDrop;
    
    renderComponent(drop);
    
    // Negative rank (-1) is truthy and <= 3, so uses top three component
    expect(screen.getByTestId('top-three-drop')).toBeInTheDocument();
    expect(screen.getByText('Top Three Drop - Rank -1')).toBeInTheDocument();
    expect(screen.queryByTestId('default-drop')).not.toBeInTheDocument();
  });
});