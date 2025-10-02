import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { WaveSmallLeaderboardTopThreeDrop } from '@/components/waves/small-leaderboard/WaveSmallLeaderboardTopThreeDrop';
import { ExtendedDrop } from '@/helpers/waves/drop.helpers';
import { ApiWave } from '@/generated/models/ApiWave';

// Mock dependencies
jest.mock('next/link', () => {
  return function MockLink({ children, href, onClick, className }: any) {
    return (
      <a href={href} onClick={onClick} className={className}>
        {children}
      </a>
    );
  };
});

jest.mock('@/helpers/Helpers', () => ({
  cicToType: (cic: number) => {
    if (cic >= 90) return 'HIGHLY_ACCURATE';
    if (cic >= 70) return 'ACCURATE';
    if (cic >= 50) return 'PROBABLY_ACCURATE';
    if (cic >= 30) return 'UNKNOWN';
    return 'INACCURATE';
  },
  formatNumberWithCommas: (num: number) => num.toLocaleString('en-US'),
}));

jest.mock('@/helpers/AllowlistToolHelpers', () => ({
  assertUnreachable: jest.fn(),
}));

jest.mock('@/components/waves/small-leaderboard/WaveSmallLeaderboardItemContent', () => {
  return {
    WaveSmallLeaderboardItemContent: function MockWaveSmallLeaderboardItemContent({ drop, onDropClick }: any) {
      return (
        <div data-testid="item-content" onClick={() => onDropClick(drop)}>
          Content for drop {drop.id}
        </div>
      );
    }
  };
});

jest.mock('@/components/waves/small-leaderboard/WaveSmallLeaderboardItemOutcomes', () => {
  return {
    WaveSmallLeaderboardItemOutcomes: function MockWaveSmallLeaderboardItemOutcomes({ drop, wave }: any) {
      return <div data-testid="item-outcomes">Outcomes for {drop.id}</div>;
    }
  };
});

jest.mock('@/components/waves/drops/winner/WinnerDropBadge', () => {
  return {
    __esModule: true,
    default: function MockWinnerDropBadge({ rank, decisionTime }: any) {
      return (
        <div data-testid="winner-badge">
          Winner Badge - Rank: {rank} {decisionTime ? `Time: ${decisionTime}` : ''}
        </div>
      );
    },
  };
});

jest.mock('@/components/drops/view/utils/DropVoteProgressing', () => {
  return {
    __esModule: true,
    default: function MockDropVoteProgressing({ current, projected }: any) {
      return (
        <div data-testid="vote-progressing">
          Progress: {current}/{projected}
        </div>
      );
    },
  };
});

describe('WaveSmallLeaderboardTopThreeDrop', () => {
  const mockWave: ApiWave = {
    id: 'wave-1',
    name: 'Test Wave',
  } as ApiWave;

  const mockOnDropClick = jest.fn();

  const createMockDrop = (overrides: Partial<ExtendedDrop> = {}): ExtendedDrop => ({
    id: 'drop-1',
    rank: 1,
    rating: 100,
    rating_prediction: 120,
    author: {
      id: 'author-1',
      handle: 'testuser',
      pfp: 'https://example.com/pfp.jpg',
      level: 5,
      cic: 85,
      banner1_color: null,
      banner2_color: null,
      rep: 0,
      tdh: 0,
      primary_address: 'test-address',
      subscribed_actions: [],
      archived: false,
    },
    created_at: Date.now(),
    title: 'Test Drop',
    winning_context: {
      decision_time: 1234567890,
    },
    ...overrides,
  } as ExtendedDrop);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders drop with rank 1 styling', () => {
    const drop = createMockDrop({ rank: 1 });
    render(
      <WaveSmallLeaderboardTopThreeDrop
        drop={drop}
        wave={mockWave}
        onDropClick={mockOnDropClick}
      />
    );

    expect(screen.getByTestId('winner-badge')).toBeInTheDocument();
    expect(screen.getByText('Winner Badge - Rank: 1 Time: 1234567890')).toBeInTheDocument();
  });

  it('renders drop with rank 2 styling', () => {
    const drop = createMockDrop({ rank: 2 });
    render(
      <WaveSmallLeaderboardTopThreeDrop
        drop={drop}
        wave={mockWave}
        onDropClick={mockOnDropClick}
      />
    );

    expect(screen.getByTestId('winner-badge')).toBeInTheDocument();
    expect(screen.getByText('Winner Badge - Rank: 2 Time: 1234567890')).toBeInTheDocument();
  });

  it('renders drop with rank 3 styling', () => {
    const drop = createMockDrop({ rank: 3 });
    render(
      <WaveSmallLeaderboardTopThreeDrop
        drop={drop}
        wave={mockWave}
        onDropClick={mockOnDropClick}
      />
    );

    expect(screen.getByTestId('winner-badge')).toBeInTheDocument();
    expect(screen.getByText('Winner Badge - Rank: 3 Time: 1234567890')).toBeInTheDocument();
  });

  it('does not render winner badge when rank is null', () => {
    const drop = createMockDrop({ rank: null });
    render(
      <WaveSmallLeaderboardTopThreeDrop
        drop={drop}
        wave={mockWave}
        onDropClick={mockOnDropClick}
      />
    );

    expect(screen.queryByTestId('winner-badge')).not.toBeInTheDocument();
  });

  it('renders author information correctly', () => {
    const drop = createMockDrop();
    render(
      <WaveSmallLeaderboardTopThreeDrop
        drop={drop}
        wave={mockWave}
        onDropClick={mockOnDropClick}
      />
    );

    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // Level
    expect(screen.getByAltText('testuser')).toBeInTheDocument(); // PFP
  });

  it('renders placeholder when author has no pfp', () => {
    const drop = createMockDrop({
      author: {
        id: 'author-1',
        handle: 'testuser',
        pfp: null,
        level: 5,
        cic: 85,
        banner1_color: null,
        banner2_color: null,
        rep: 0,
        tdh: 0,
        primary_address: 'test-address',
        subscribed_actions: [],
        archived: false,
      },
    });
    render(
      <WaveSmallLeaderboardTopThreeDrop
        drop={drop}
        wave={mockWave}
        onDropClick={mockOnDropClick}
      />
    );

    const placeholderDiv = document.querySelector('.tw-size-6.tw-flex-shrink-0.tw-rounded-lg.tw-bg-iron-800');
    expect(placeholderDiv).toBeInTheDocument();
  });

  it('displays rating information', () => {
    const drop = createMockDrop({ rating: 1234 });
    render(
      <WaveSmallLeaderboardTopThreeDrop
        drop={drop}
        wave={mockWave}
        onDropClick={mockOnDropClick}
      />
    );

    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByTestId('vote-progressing')).toBeInTheDocument();
  });

  it('renders all child components', () => {
    const drop = createMockDrop();
    render(
      <WaveSmallLeaderboardTopThreeDrop
        drop={drop}
        wave={mockWave}
        onDropClick={mockOnDropClick}
      />
    );

    expect(screen.getByTestId('item-content')).toBeInTheDocument();
    expect(screen.getByTestId('item-outcomes')).toBeInTheDocument();
  });

  it('applies correct CIC color for highly accurate', () => {
    const drop = createMockDrop({
      author: { ...createMockDrop().author, cic: 95 },
    });
    const { container } = render(
      <WaveSmallLeaderboardTopThreeDrop
        drop={drop}
        wave={mockWave}
        onDropClick={mockOnDropClick}
      />
    );

    const cicIndicator = container.querySelector('.tw-bg-\\[\\#3CCB7F\\]');
    expect(cicIndicator).toBeInTheDocument();
  });

  it('applies correct CIC color for inaccurate', () => {
    const drop = createMockDrop({
      author: { ...createMockDrop().author, cic: 25 },
    });
    const { container } = render(
      <WaveSmallLeaderboardTopThreeDrop
        drop={drop}
        wave={mockWave}
        onDropClick={mockOnDropClick}
      />
    );

    const cicIndicator = container.querySelector('.tw-bg-\\[\\#F97066\\]');
    expect(cicIndicator).toBeInTheDocument();
  });

  it('stops propagation when author link is clicked', () => {
    const drop = createMockDrop();
    const { container } = render(
      <WaveSmallLeaderboardTopThreeDrop
        drop={drop}
        wave={mockWave}
        onDropClick={mockOnDropClick}
      />
    );

    const authorLink = screen.getByRole('link');
    
    // Spy on stopPropagation on the prototype
    const stopPropagationSpy = jest.spyOn(Event.prototype, 'stopPropagation');
    
    fireEvent.click(authorLink);

    expect(stopPropagationSpy).toHaveBeenCalled();
    
    stopPropagationSpy.mockRestore();
  });

  it('has correct hover styling classes', () => {
    const drop = createMockDrop();
    const { container } = render(
      <WaveSmallLeaderboardTopThreeDrop
        drop={drop}
        wave={mockWave}
        onDropClick={mockOnDropClick}
      />
    );

    const dropContainer = container.querySelector('.desktop-hover\\:hover\\:tw-bg-iron-800\\/80');
    expect(dropContainer).toBeInTheDocument();
  });

  it('renders with correct rank-based border styling', () => {
    const drop = createMockDrop({ rank: 1 });
    const { container } = render(
      <WaveSmallLeaderboardTopThreeDrop
        drop={drop}
        wave={mockWave}
        onDropClick={mockOnDropClick}
      />
    );

    // Check that the element has custom style attribute
    const styledElement = container.querySelector('[style*="box-shadow"]');
    expect(styledElement).toBeInTheDocument();
  });

  it('handles missing winning context gracefully', () => {
    const drop = createMockDrop({ winning_context: undefined });
    render(
      <WaveSmallLeaderboardTopThreeDrop
        drop={drop}
        wave={mockWave}
        onDropClick={mockOnDropClick}
      />
    );

    expect(screen.getByText('Winner Badge - Rank: 1')).toBeInTheDocument();
  });
});