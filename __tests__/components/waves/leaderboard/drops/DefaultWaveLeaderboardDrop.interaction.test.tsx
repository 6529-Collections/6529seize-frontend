import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DefaultWaveLeaderboardDrop } from '@/components/waves/leaderboard/drops/DefaultWaveLeaderboardDrop';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  usePathname: () => '/',
  useSearchParams: () => ({ toString: () => '', get: () => null }),
}));
jest.mock('@/hooks/drops/useDropInteractionRules', () => ({
  useDropInteractionRules: jest.fn(),
}));
jest.mock('@/hooks/useDeviceInfo', () => jest.fn());
jest.mock('@/hooks/isMobileScreen', () => jest.fn());
jest.mock('@/hooks/useLongPressInteraction', () => jest.fn());
jest.mock('@/components/voting', () => ({
  VotingModal: (p: any) => <div data-testid="modal">{String(p.isOpen)}</div>,
  MobileVotingModal: (p: any) => <div data-testid="mobile">{String(p.isOpen)}</div>,
}));
jest.mock('@/components/voting/VotingModalButton', () => (p: any) => <button data-testid="vote-btn" onClick={p.onClick} />);
jest.mock('@/components/waves/drops/WaveDropActionsOptions', () => ({ __esModule: true, default: () => <div data-testid="options" /> }));
jest.mock('@/components/waves/drops/WaveDropActionsOpen', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('@/components/waves/drops/WaveDropMobileMenuOpen', () => () => <div />);
jest.mock('@/components/waves/drops/WaveDropMobileMenuDelete', () => () => <div />);
jest.mock('@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper', () => (p: any) => <div>{p.children}</div>);
jest.mock('@/components/waves/leaderboard/drops/header/WaveLeaderboardDropHeader', () => ({ WaveLeaderboardDropHeader: () => <div data-testid="header" /> }));
jest.mock('@/components/waves/leaderboard/content/WaveLeaderboardDropContent', () => ({ WaveLeaderboardDropContent: () => <div data-testid="content" /> }));
jest.mock('@/components/waves/leaderboard/drops/footer/WaveLeaderboardDropFooter', () => ({ WaveLeaderboardDropFooter: () => <div data-testid="footer" /> }));
jest.mock('@/components/waves/leaderboard/drops/header/WaveleaderboardDropRaters', () => ({ WaveLeaderboardDropRaters: () => <div data-testid="raters" /> }));

const useRules = require('@/hooks/drops/useDropInteractionRules').useDropInteractionRules as jest.Mock;
const useDeviceInfo = require('@/hooks/useDeviceInfo') as jest.Mock;
const useIsMobileScreen = require('@/hooks/isMobileScreen') as jest.Mock;
const useLongPressInteraction = require('@/hooks/useLongPressInteraction') as jest.Mock;

const drop = { 
  id: 'd1', 
  rank: 1,
  author: {
    handle: 'testuser',
    pfp: null,
    level: 1,
    cic: 0
  },
  created_at: new Date().toISOString()
} as any;
const wave = { id: 'w1' } as any;

beforeEach(() => {
  useLongPressInteraction.mockReturnValue({ isActive: false, setIsActive: jest.fn(), touchHandlers: {} });
});

test('opens voting modal when button clicked', async () => {
  const user = userEvent.setup();
  useRules.mockReturnValue({ canShowVote: true, canDelete: true });
  useDeviceInfo.mockReturnValue({ hasTouchScreen: false });
  useIsMobileScreen.mockReturnValue(false);
  render(<DefaultWaveLeaderboardDrop drop={drop} wave={wave} onDropClick={jest.fn()} />);
  expect(screen.getByTestId('modal')).toHaveTextContent('false');
  await user.click(screen.getByTestId('vote-btn'));
  expect(screen.getByTestId('modal')).toHaveTextContent('true');
  expect(screen.getByTestId('options')).toBeInTheDocument();
});

test('uses mobile modal and hides options when cannot delete', () => {
  useRules.mockReturnValue({ canShowVote: true, canDelete: false });
  useDeviceInfo.mockReturnValue({ hasTouchScreen: false });
  useIsMobileScreen.mockReturnValue(true);
  useLongPressInteraction.mockReturnValue({ isActive: false, setIsActive: jest.fn(), touchHandlers: {} });
  render(<DefaultWaveLeaderboardDrop drop={drop} wave={wave} onDropClick={jest.fn()} />);
  expect(screen.getByTestId('mobile')).toHaveTextContent('false');
  expect(screen.queryByTestId('options')).toBeNull();
});
