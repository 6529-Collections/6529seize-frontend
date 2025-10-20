import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import MyStreamWaveTabsDefault from '@/components/brain/my-stream/tabs/MyStreamWaveTabsDefault';
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
  default: ({ activeTab, setActiveTab }: any) => (
    <div>
      <span data-testid="active">{activeTab}</span>
      <button onClick={() => setActiveTab('NEW')}>change</button>
    </div>
  )
}));

jest.mock('@/components/brain/ContentTabContext', () => ({
  useContentTab: (...args: any[]) => useContentTab(...args)
}));

describe('MyStreamWaveTabsDefault', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockUseBreakpoint.mockReturnValue('LG');
    useContentTab.mockReset();
  });

  it('passes active tab and handles tab change', () => {
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
        <MyStreamWaveTabsDefault wave={wave} />
      </SidebarProvider>
    );
    expect(screen.getByTestId('active')).toHaveTextContent('CHAT');
    fireEvent.click(screen.getByText('change'));
    expect(setActiveContentTab).toHaveBeenCalledWith('NEW');
  });
});
