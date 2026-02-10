import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import MyStreamWaveTabsMeme from '@/components/brain/my-stream/tabs/MyStreamWaveTabsMeme';
import { SidebarProvider } from '@/hooks/useSidebarState';

const mockPush = jest.fn();
const mockUseBreakpoint = jest.fn(() => 'LG');

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  useSearchParams: () => new URLSearchParams('wave=w1'),
  usePathname: () => '/waves',
}));

jest.mock('react-use', () => {
  const actual = jest.requireActual('react-use');
  return {
    __esModule: true,
    ...actual,
    createBreakpoint: () => (...args: any[]) => mockUseBreakpoint(...args),
  };
});

const useContentTab = jest.fn();

jest.mock('@/components/brain/my-stream/MyStreamWaveDesktopTabs', () => ({
  __esModule: true,
  default: ({ activeTab }: any) => <div data-testid="desktop">{activeTab}</div>
}));

jest.mock('@/components/brain/ContentTabContext', () => ({
  useContentTab: (...args: any[]) => useContentTab(...args)
}));

jest.mock('@/components/waves/memes/MemesArtSubmissionModal', () => ({
  __esModule: true,
  default: ({ isOpen }: any) => isOpen ? <div data-testid="modal">open</div> : null
}));

jest.mock('@/components/brain/my-stream/tabs/MyStreamWaveTabsMemeSubmit', () => ({
  __esModule: true,
  default: ({ handleMemesSubmit }: any) => <button onClick={handleMemesSubmit}>submit</button>
}));

jest.mock('@/hooks/useWave', () => ({
  useWave: () => ({
    isMemesWave: true,
    isRankWave: false,
    pauses: { filterDecisionsDuringPauses: (decisions: any) => decisions },
  }),
}));

jest.mock('@/hooks/waves/useDecisionPoints', () => ({
  useDecisionPoints: () => ({ allDecisions: [] }),
}));

jest.mock('@/helpers/waves/time.utils', () => ({
  calculateTimeLeft: () => ({ days: 0, hours: 0, minutes: 0, seconds: 0 }),
}));

jest.mock('@/helpers/time', () => ({
  Time: { currentMillis: () => Date.now() },
}));

jest.mock('@/components/waves/leaderboard/time/CompactTimeCountdown', () => ({
  CompactTimeCountdown: () => <div data-testid="countdown" />,
}));

describe('MyStreamWaveTabsMeme', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockUseBreakpoint.mockReturnValue('LG');
    useContentTab.mockReset();
  });

  it('opens modal when submit clicked and passes active tab', () => {
    const setActiveContentTab = jest.fn();
    useContentTab.mockReturnValue({ activeContentTab: 'CHAT', setActiveContentTab });
    const wave = {
      id: 'w1',
      name: 'Wave',
      picture: null,
      contributors_overview: [],
    } as any;
    render(
      <SidebarProvider>
        <MyStreamWaveTabsMeme wave={wave} />
      </SidebarProvider>
    );
    expect(screen.getByTestId('desktop')).toHaveTextContent('CHAT');
    fireEvent.click(screen.getByText('submit'));
    expect(screen.getByTestId('modal')).toHaveTextContent('open');
  });
});
