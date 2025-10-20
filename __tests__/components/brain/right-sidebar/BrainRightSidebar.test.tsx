import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn(), keepPreviousData: {} }));

const WaveContentMock = jest.fn((props: any) => <div data-testid="content" />);
jest.mock('@/components/brain/right-sidebar/WaveContent', () => ({
  __esModule: true,
  WaveContent: (props: any) => WaveContentMock(props),
}));

const closeRightSidebar = jest.fn();
jest.mock('@/hooks/useSidebarState', () => {
  return {
    __esModule: true,
    SidebarProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useSidebarState: () => ({
      isRightSidebarOpen: true,
      toggleRightSidebar: jest.fn(),
      openRightSidebar: jest.fn(),
      closeRightSidebar,
    }),
  };
});

import BrainRightSidebar, { Mode, SidebarTab } from '@/components/brain/right-sidebar/BrainRightSidebar';
import { SidebarProvider } from '@/hooks/useSidebarState';
import { useQuery } from '@tanstack/react-query';

const mockUseQuery = useQuery as jest.Mock;

describe('BrainRightSidebar', () => {
  const wave = { id: '1', wave: { type: 'RANK' } } as any;
  const setActiveTab = jest.fn();
  const onDropClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuery.mockReturnValue({ data: wave });
    closeRightSidebar.mockClear();
  });

  const renderSidebar = (ui: React.ReactNode) => render(<SidebarProvider>{ui}</SidebarProvider>);

  it('renders WaveContent with fetched wave data', () => {
    renderSidebar(
      <BrainRightSidebar
        waveId="1"
        onDropClick={onDropClick}
        activeTab={SidebarTab.ABOUT}
        setActiveTab={setActiveTab}
      />
    );
    expect(WaveContentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        wave,
        mode: Mode.CONTENT,
        activeTab: SidebarTab.ABOUT,
        setActiveTab,
        onDropClick,
      })
    );
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('toggles collapsed state when button clicked', async () => {
    const user = userEvent.setup();
    renderSidebar(
      <BrainRightSidebar
        waveId="1"
        onDropClick={onDropClick}
        activeTab={SidebarTab.ABOUT}
        setActiveTab={setActiveTab}
      />
    );
    await user.click(screen.getByRole('button', { name: /close sidebar/i }));
    expect(closeRightSidebar).toHaveBeenCalledTimes(1);
  });

  it('does not render WaveContent when no wave data', () => {
    mockUseQuery.mockReturnValue({ data: undefined });
    const { container } = renderSidebar(
      <BrainRightSidebar
        waveId="1"
        onDropClick={onDropClick}
        activeTab={SidebarTab.ABOUT}
        setActiveTab={setActiveTab}
      />
    );
    expect(container.querySelector('[data-testid="content"]')).toBeNull();
  });
});
