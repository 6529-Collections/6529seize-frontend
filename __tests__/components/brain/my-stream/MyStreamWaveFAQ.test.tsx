import { render, screen } from '@testing-library/react';
import React from 'react';
import { MyStreamWaveTab } from '@/types/waves.types';

const setActiveContentTab = jest.fn();

jest.mock('@/components/brain/ContentTabContext', () => ({
  useContentTab: () => ({ setActiveContentTab }),
}));

const useLayoutMock = jest.fn();
jest.mock('@/components/brain/my-stream/layout/LayoutContext', () => ({
  useLayout: () => useLayoutMock(),
}));

import MyStreamWaveFAQ from '@/components/brain/my-stream/MyStreamWaveFAQ';

describe('MyStreamWaveFAQ', () => {
  beforeEach(() => {
    setActiveContentTab.mockClear();
    useLayoutMock.mockReturnValue({ faqViewStyle: { height: '21px' } });
  });

  it('sets active tab to FAQ and applies style', () => {
    const { container } = render(<MyStreamWaveFAQ wave={{} as any} />);

    expect(setActiveContentTab).toHaveBeenCalledWith(MyStreamWaveTab.FAQ);
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv).toHaveAttribute('style', 'height: 21px;');
    expect(screen.getByText('The Memes - Main Stage FAQ')).toBeInTheDocument();
  });
});
