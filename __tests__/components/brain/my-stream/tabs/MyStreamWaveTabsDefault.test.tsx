import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import MyStreamWaveTabsDefault from '@/components/brain/my-stream/tabs/MyStreamWaveTabsDefault';

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
  it('passes active tab and handles tab change', () => {
    const setActiveContentTab = jest.fn();
    useContentTab.mockReturnValue({ activeContentTab: 'CHAT', setActiveContentTab });
    const wave = { id: 'w1' } as any;
    render(<MyStreamWaveTabsDefault wave={wave} />);
    expect(screen.getByTestId('active')).toHaveTextContent('CHAT');
    fireEvent.click(screen.getByText('change'));
    expect(setActiveContentTab).toHaveBeenCalledWith('NEW');
  });
});
