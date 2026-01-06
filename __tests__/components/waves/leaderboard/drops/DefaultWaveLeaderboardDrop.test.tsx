import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DefaultWaveLeaderboardDrop } from '@/components/waves/leaderboard/drops/DefaultWaveLeaderboardDrop';
import type { ApiWave } from '@/generated/models/ObjectSerializer';

jest.mock('@/hooks/drops/useDropInteractionRules', () => ({ useDropInteractionRules: () => ({ canShowVote: true, canDelete: true }) }));
jest.mock('@/hooks/useDeviceInfo', () => ({ __esModule: true, default: () => ({ hasTouchScreen: false }) }));
jest.mock('@/hooks/isMobileScreen', () => ({ __esModule: true, default: () => false }));
jest.mock('@/hooks/useLongPressInteraction', () => ({ __esModule: true, default: () => ({ isActive:false, setIsActive: jest.fn(), touchHandlers:{} }) }));

jest.mock('@/components/voting', () => ({
  VotingModal: ({ isOpen }: any) => (isOpen ? <div data-testid="modal" /> : null),
  MobileVotingModal: ({ isOpen }: any) => (isOpen ? <div data-testid="mobile" /> : null)
}));
jest.mock('@/components/voting/VotingModalButton', () => ({ __esModule:true, default: (p:any) => <button data-testid="vote" onClick={p.onClick} /> }));

jest.mock('@/components/waves/drops/WaveDropActionsOptions', () => ({ __esModule: true, default: () => <div data-testid="options" /> }));
jest.mock('@/components/waves/drops/WaveDropActionsOpen', () => ({ __esModule: true, default: () => <div data-testid="open" /> }));
jest.mock('@/components/waves/drops/WaveDropMobileMenuOpen', () => ({ __esModule: true, default: () => <div data-testid="mobile-open" /> }));
jest.mock('@/components/waves/drops/WaveDropMobileMenuDelete', () => ({ __esModule: true, default: () => <div data-testid="mobile-delete" /> }));

jest.mock('@/components/waves/leaderboard/drops/header/WaveLeaderboardDropHeader', () => ({ WaveLeaderboardDropHeader: () => <div data-testid="header" /> }));
jest.mock('@/components/waves/leaderboard/content/WaveLeaderboardDropContent', () => ({ WaveLeaderboardDropContent: () => <div data-testid="content" /> }));
jest.mock('@/components/waves/leaderboard/drops/footer/WaveLeaderboardDropFooter', () => ({ WaveLeaderboardDropFooter: () => <div data-testid="footer" /> }));
jest.mock('@/components/waves/leaderboard/drops/header/WaveleaderboardDropRaters', () => ({ WaveLeaderboardDropRaters: () => <div data-testid="raters" /> }));

jest.mock('@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper', () => ({ __esModule:true, default: ({ isOpen, children }: any) => isOpen ? <div data-testid="mobile-wrapper">{children}</div> : null }));

describe('DefaultWaveLeaderboardDrop', () => {
  const drop: any = { id: '1', rank: 1 };
  const wave: ApiWave = { id: 'w1' } as ApiWave;
  it('applies border classes based on rank', () => {
    const { container } = render(
      <DefaultWaveLeaderboardDrop drop={{ ...drop, rank: 2 }} wave={wave} onDropClick={jest.fn()} />
    );
    expect(container.innerHTML).toContain('tw-border-iron-800');
  });

  it('opens voting modal when button clicked', () => {
    render(<DefaultWaveLeaderboardDrop drop={drop} wave={wave} onDropClick={jest.fn()} />);
    fireEvent.click(screen.getByTestId('vote'));
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('calls onDropClick', () => {
    const onClick = jest.fn();
    const { container } = render(<DefaultWaveLeaderboardDrop drop={drop} wave={wave} onDropClick={onClick} />);
    fireEvent.click(container.firstChild as HTMLElement);
    expect(onClick).toHaveBeenCalled();
  });
});
