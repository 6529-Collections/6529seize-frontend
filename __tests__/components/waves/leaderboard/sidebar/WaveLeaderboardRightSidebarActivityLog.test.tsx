import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WaveLeaderboardRightSidebarActivityLog } from '@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarActivityLog';
import { ApiWaveLog } from '@/generated/models/ApiWaveLog';
import { ApiWaveCreditType } from '@/generated/models/ApiWaveCreditType';

// Mock dependencies
jest.mock('@/helpers/Helpers', () => ({
  formatNumberWithCommas: jest.fn((num) => num >= 1000 ? `${Math.floor(num/1000)},${(num%1000).toString().padStart(3, '0')}` : num.toString()),
  getTimeAgoShort: jest.fn(() => '5m'),
}));

jest.mock('next/link', () => {
  return function Link({ href, children, className, title }: any) {
    return (
      <a href={href} className={className} title={title}>
        {children}
      </a>
    );
  };
});

jest.mock('@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarActivityLogDrop', () => ({
  WaveLeaderboardRightSidebarActivityLogDrop: function({ log, onDropClick }: any) {
    return (
      <button onClick={() => onDropClick(log)} data-testid="drop-click-button">
        Drop Button
      </button>
    );
  },
}));

jest.mock('@/components/common/SystemAdjustmentPill', () => ({
  SystemAdjustmentPill: function() {
    return <span data-testid="system-adjustment-pill">System Adjustment</span>;
  },
}));

describe('WaveLeaderboardRightSidebarActivityLog', () => {
  const mockOnDropClick = jest.fn();

  const mockLog: ApiWaveLog = {
    id: 'log-1',
    action: 'VOTE',
    wave_id: 'wave-1',
    drop_id: 'drop-1',
    created_at: '2024-01-01T10:00:00Z' as any,
    invoker: {
      handle: 'voter_user',
      pfp: 'https://example.com/voter.jpg',
    } as any,
    drop_author: {
      handle: 'author_user',
      pfp: 'https://example.com/author.jpg',
    } as any,
    contents: {
      oldVote: 1000,
      newVote: 1000,
      reason: null,
    },
  };

  const defaultProps = {
    log: mockLog,
    creditType: ApiWaveCreditType.Rep,
    onDropClick: mockOnDropClick,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(<WaveLeaderboardRightSidebarActivityLog {...defaultProps} {...props} />);
  };

  it('renders the activity log container', () => {
    renderComponent();
    
    const container = document.querySelector('.tw-p-3.tw-rounded-lg.tw-bg-iron-900');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('tw-p-3', 'tw-rounded-lg', 'tw-bg-iron-900');
  });

  it('displays timestamp with clock icon', () => {
    renderComponent();
    
    expect(screen.getByText('5m')).toBeInTheDocument();
    
    const clockIcon = document.querySelector('svg');
    expect(clockIcon).toBeInTheDocument();
    expect(clockIcon).toHaveClass('tw-w-3.5', 'tw-h-3.5', 'tw-text-iron-400');
  });

  it('renders drop click button component', () => {
    renderComponent();
    
    const dropButton = screen.getByTestId('drop-click-button');
    expect(dropButton).toBeInTheDocument();
  });

  it('calls onDropClick when drop button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const dropButton = screen.getByTestId('drop-click-button');
    await user.click(dropButton);
    
    expect(mockOnDropClick).toHaveBeenCalledWith(mockLog);
  });

  it('displays voter information with profile picture', () => {
    renderComponent();
    
    const voterLink = screen.getByTitle('Voter: voter_user');
    expect(voterLink).toHaveAttribute('href', '/voter_user');
    expect(screen.getByText('voter_user')).toBeInTheDocument();
    
    const voterPfp = voterLink.querySelector('img');
    expect(voterPfp).toHaveAttribute('src', 'https://example.com/voter.jpg');
    expect(voterPfp).toHaveClass('tw-size-5', 'tw-rounded-md');
  });

  it('displays voter information without profile picture', () => {
    const logWithoutVoterPfp = {
      ...mockLog,
      invoker: { ...mockLog.invoker, pfp: null },
    };
    
    renderComponent({ log: logWithoutVoterPfp });
    
    const voterLink = screen.getByTitle('Voter: voter_user');
    const placeholderDiv = voterLink.querySelector('div.tw-size-5');
    expect(placeholderDiv).toBeInTheDocument();
    expect(placeholderDiv).toHaveClass('tw-bg-iron-800');
  });

  it('displays drop author information with profile picture', () => {
    renderComponent();
    
    const authorLink = screen.getByTitle('Drop creator: author_user');
    expect(authorLink).toHaveAttribute('href', '/author_user');
    expect(screen.getByText('author_user')).toBeInTheDocument();
    
    const authorPfp = authorLink.querySelector('img');
    expect(authorPfp).toHaveAttribute('src', 'https://example.com/author.jpg');
  });

  it('displays drop author information without profile picture', () => {
    const logWithoutAuthorPfp = {
      ...mockLog,
      drop_author: { ...mockLog.drop_author, pfp: null },
    };
    
    renderComponent({ log: logWithoutAuthorPfp });
    
    const authorLink = screen.getByTitle('Drop creator: author_user');
    const placeholderDiv = authorLink.querySelector('div.tw-size-5');
    expect(placeholderDiv).toBeInTheDocument();
  });

  it('displays vote change from old to new', () => {
    renderComponent();
    
    expect(screen.getByText('1,000 →')).toBeInTheDocument();
    expect(screen.getByText('1,000 REP')).toBeInTheDocument();
  });

  it('displays "voted" text for first-time votes', () => {
    const firstVoteLog = {
      ...mockLog,
      contents: { ...mockLog.contents, oldVote: 0 },
    };
    
    renderComponent({ log: firstVoteLog });
    
    expect(screen.getByText('voted')).toBeInTheDocument();
    expect(screen.queryByText('0 →')).not.toBeInTheDocument();
  });

  it('applies green color for positive new votes', () => {
    renderComponent();
    
    const newVoteSpan = screen.getByText('1,000 REP');
    expect(newVoteSpan).toHaveClass('tw-text-green');
  });

  it('applies red color for negative new votes', () => {
    const negativeVoteLog = {
      ...mockLog,
      contents: { ...mockLog.contents, newVote: -5 },
    };
    
    renderComponent({ log: negativeVoteLog });
    
    const newVoteSpan = screen.getByText('-5 REP');
    expect(newVoteSpan).toHaveClass('tw-text-red');
  });

  it('displays system adjustment pill when reason is CREDIT_OVERSPENT', () => {
    const overspentLog = {
      ...mockLog,
      contents: { ...mockLog.contents, reason: 'CREDIT_OVERSPENT' },
    };
    
    renderComponent({ log: overspentLog });
    
    expect(screen.getByTestId('system-adjustment-pill')).toBeInTheDocument();
  });

  it('does not display system adjustment pill for other reasons', () => {
    renderComponent();
    
    expect(screen.queryByTestId('system-adjustment-pill')).not.toBeInTheDocument();
  });

  it('displays correct credit type', () => {
    renderComponent({ creditType: ApiWaveCreditType.Tdh });
    
    expect(screen.getByText('1,000 TDH')).toBeInTheDocument();
  });

  it('formats numbers with commas in vote display', () => {
    const { formatNumberWithCommas } = require('@/helpers/Helpers');
    formatNumberWithCommas.mockReturnValue('1,000');
    
    const largeVoteLog = {
      ...mockLog,
      contents: { oldVote: 1000, newVote: 1500 },
    };
    
    renderComponent({ log: largeVoteLog });
    
    expect(formatNumberWithCommas).toHaveBeenCalledWith(1000);
    expect(formatNumberWithCommas).toHaveBeenCalledWith(1500);
  });

  it('applies correct styling classes to vote elements', () => {
    renderComponent();
    
    const oldVoteSpan = screen.getByText('1,000 →');
    expect(oldVoteSpan).toHaveClass('tw-text-sm', 'tw-text-iron-500', 'tw-whitespace-nowrap');
    
    const newVoteSpan = screen.getByText('1,000 REP');
    expect(newVoteSpan).toHaveClass('tw-text-sm', 'tw-font-semibold', 'tw-whitespace-nowrap');
  });

  it('applies hover effects to user links', () => {
    renderComponent();
    
    const voterLink = screen.getByTitle('Voter: voter_user');
    expect(voterLink).toHaveClass(
      'tw-group',
      'desktop-hover:hover:tw-opacity-80',
      'tw-transition-all',
      'tw-duration-300'
    );
    
    const authorLink = screen.getByTitle('Drop creator: author_user');
    expect(authorLink).toHaveClass(
      'tw-group',
      'desktop-hover:hover:tw-opacity-80',
      'tw-transition-all',
      'tw-duration-300'
    );
  });
});