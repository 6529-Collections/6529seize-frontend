import { render } from '@testing-library/react';
import React from 'react';

const directMessagesListMock = jest.fn();

jest.mock('@/components/brain/direct-messages/DirectMessagesList', () => ({
  __esModule: true,
  default: (props: any) => {
    directMessagesListMock(props);
    return <div data-testid="direct-messages" />;
  },
}));

const useLayoutMock = jest.fn();
jest.mock('@/components/brain/my-stream/layout/LayoutContext', () => ({
  useLayout: () => useLayoutMock(),
}));

import BrainMobileMessages from '@/components/brain/mobile/BrainMobileMessages';

describe('BrainMobileMessages', () => {
  beforeEach(() => {
    directMessagesListMock.mockClear();
    useLayoutMock.mockReturnValue({ mobileWavesViewStyle: { height: '42px' } });
  });

  it('renders and passes scrollContainerRef to DirectMessagesList', () => {
    const { container } = render(<BrainMobileMessages />);

    expect(directMessagesListMock).toHaveBeenCalledTimes(1);
    const { scrollContainerRef } = directMessagesListMock.mock.calls[0][0];
    const rootDiv = container.firstChild as HTMLElement;

    // ref should point to the rendered div
    expect(scrollContainerRef.current).toBe(rootDiv);
    // style from useLayout should be applied
    expect(rootDiv).toHaveAttribute('style', 'height: 42px;');
  });
});
