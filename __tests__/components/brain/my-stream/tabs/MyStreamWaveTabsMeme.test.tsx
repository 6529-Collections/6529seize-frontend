import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import MyStreamWaveTabsMeme from '../../../../../components/brain/my-stream/tabs/MyStreamWaveTabsMeme';

const useContentTab = jest.fn();

jest.mock('../../../../../components/brain/my-stream/MyStreamWaveDesktopTabs', () => ({
  __esModule: true,
  default: ({ activeTab }: any) => <div data-testid="desktop">{activeTab}</div>
}));

jest.mock('../../../../../components/brain/ContentTabContext', () => ({
  useContentTab: (...args: any[]) => useContentTab(...args)
}));

jest.mock('../../../../../components/waves/memes/MemesArtSubmissionModal', () => ({
  __esModule: true,
  default: ({ isOpen }: any) => isOpen ? <div data-testid="modal">open</div> : null
}));

jest.mock('../../../../../components/brain/my-stream/tabs/MyStreamWaveTabsMemeSubmit', () => ({
  __esModule: true,
  default: ({ handleMemesSubmit }: any) => <button onClick={handleMemesSubmit}>submit</button>
}));

describe('MyStreamWaveTabsMeme', () => {
  it('opens modal when submit clicked and passes active tab', () => {
    const setActiveContentTab = jest.fn();
    useContentTab.mockReturnValue({ activeContentTab: 'CHAT', setActiveContentTab });
    const wave = { id: 'w1', name: 'Wave' } as any;
    render(<MyStreamWaveTabsMeme wave={wave} />);
    expect(screen.getByTestId('desktop')).toHaveTextContent('CHAT');
    fireEvent.click(screen.getByText('submit'));
    expect(screen.getByTestId('modal')).toHaveTextContent('open');
  });
});
