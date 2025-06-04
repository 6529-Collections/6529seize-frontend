import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import BrainLeftSidebar from '../../../../components/brain/left-sidebar/BrainLeftSidebar';
import { MyStreamWaveTab } from '../../../../types/waves.types';
import { useRouter } from 'next/router';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('../../../../components/auth/Auth', () => ({ useAuth: jest.fn() }));
jest.mock('../../../../hooks/useUnreadIndicator', () => ({ useUnreadIndicator: jest.fn() }));
jest.mock('../../../../hooks/useWaveData', () => ({ useWaveData: jest.fn() }));
jest.mock('../../../../hooks/useWave', () => ({ useWave: jest.fn() }));
jest.mock('../../../../components/brain/ContentTabContext', () => ({ useContentTab: jest.fn() }));

jest.mock('../../../../components/brain/left-sidebar/BrainLeftSidebarViewChange', () => ({
  BrainLeftSidebarViewChange: () => <div data-testid="view-change" />,
}));
jest.mock('../../../../components/brain/left-sidebar/search-wave/BrainLeftSidebarSearchWave', () => ({
  __esModule: true,
  default: ({ listType }: any) => <div data-testid="search-wave">{listType}</div>,
}));
jest.mock('../../../../components/brain/left-sidebar/waves/BrainLeftSidebarWaves', () => ({
  __esModule: true,
  default: () => <div data-testid="waves-list" />,
}));
jest.mock('../../../../components/brain/direct-messages/DirectMessagesList', () => ({
  __esModule: true,
  default: () => <div data-testid="dm-list" />,
}));

const { useAuth } = jest.requireMock('../../../../components/auth/Auth');
const { useUnreadIndicator } = jest.requireMock('../../../../hooks/useUnreadIndicator');
const { useWaveData } = jest.requireMock('../../../../hooks/useWaveData');
const { useWave } = jest.requireMock('../../../../hooks/useWave');
const { useContentTab } = jest.requireMock('../../../../components/brain/ContentTabContext');
const { useRouter: useRouterMock } = require('next/router');

beforeEach(() => {
  jest.clearAllMocks();
  (useAuth as jest.Mock).mockReturnValue({ connectedProfile: { handle: 'alice' } });
  (useWaveData as jest.Mock).mockReturnValue({ data: null });
  (useWave as jest.Mock).mockReturnValue({ isDm: false });
  (useContentTab as jest.Mock).mockReturnValue({
    activeContentTab: MyStreamWaveTab.CHAT,
    setActiveContentTab: jest.fn(),
    availableTabs: [MyStreamWaveTab.CHAT, MyStreamWaveTab.LEADERBOARD],
  });
});

function setup(query: any = {}, waveIsDm = false) {
  const router = { query } as any;
  (useRouterMock as jest.Mock).mockReturnValue(router);
  (useWave as jest.Mock).mockReturnValue({ isDm: waveIsDm });
  (useUnreadIndicator as jest.Mock).mockReturnValue({ hasUnread: true });
  (useWaveData as jest.Mock).mockReturnValue({ data: waveIsDm ? {} : null });
  return render(<BrainLeftSidebar activeWaveId="wave1" />);
}

it('shows messages tab and DM list when view param is messages', async () => {
  setup({ view: 'messages' }, false);
  expect(screen.getByTestId('search-wave')).toHaveTextContent('messages');
  await waitFor(() => expect(screen.getByTestId('dm-list')).toBeInTheDocument());
  expect(screen.queryByTestId('waves-list')).not.toBeInTheDocument();
  const msgButton = screen.getByRole('button', { name: 'Messages' });
  expect(msgButton.querySelector('.tw-bg-red')).toBeTruthy();
  await waitFor(() => expect(localStorage.getItem('sidebarTab')).toBe('messages'));
});

it('renders DM list for direct messages when view param is messages', async () => {
  setup({ view: 'messages' }, true);
  await waitFor(() => expect(screen.getByTestId('dm-list')).toBeInTheDocument());
  expect(screen.queryByTestId('waves-list')).not.toBeInTheDocument();
});
