import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn(), keepPreviousData: {} }));

const WaveContentMock = jest.fn((props: any) => <div data-testid="content" />);
jest.mock('@/components/brain/right-sidebar/WaveContent', () => ({
  __esModule: true,
  WaveContent: (props: any) => WaveContentMock(props),
}));

import BrainRightSidebar, { Mode, SidebarTab } from '@/components/brain/right-sidebar/BrainRightSidebar';
import { useQuery } from '@tanstack/react-query';

const mockUseQuery = useQuery as jest.Mock;

describe('BrainRightSidebar', () => {
  const wave = { id: '1', wave: { type: 'RANK' } } as any;
  const setIsCollapsed = jest.fn();
  const setActiveTab = jest.fn();
  const onDropClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuery.mockReturnValue({ data: wave });
  });

  it('renders WaveContent with fetched wave data', () => {
    render(
      <BrainRightSidebar
        isCollapsed={false}
        setIsCollapsed={setIsCollapsed}
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
    render(
      <BrainRightSidebar
        isCollapsed={false}
        setIsCollapsed={setIsCollapsed}
        waveId="1"
        onDropClick={onDropClick}
        activeTab={SidebarTab.ABOUT}
        setActiveTab={setActiveTab}
      />
    );
    await user.click(screen.getByRole('button', { name: /toggle sidebar/i }));
    expect(setIsCollapsed).toHaveBeenCalledWith(true);
  });

  it('does not render WaveContent when no wave data', () => {
    mockUseQuery.mockReturnValue({ data: undefined });
    const { container } = render(
      <BrainRightSidebar
        isCollapsed={false}
        setIsCollapsed={setIsCollapsed}
        waveId="1"
        onDropClick={onDropClick}
        activeTab={SidebarTab.ABOUT}
        setActiveTab={setActiveTab}
      />
    );
    expect(container.querySelector('[data-testid="content"]')).toBeNull();
  });
});
