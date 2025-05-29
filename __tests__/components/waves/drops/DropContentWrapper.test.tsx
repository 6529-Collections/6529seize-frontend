import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DropContentWrapper from '../../../../components/waves/drops/DropContentWrapper';

declare const ResizeObserver: any;

beforeAll(() => {
  (global as any).ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
  Object.defineProperty(HTMLDivElement.prototype, 'scrollHeight', {
    configurable: true,
    get() {
      return 1501;
    },
  });
  Object.defineProperty(HTMLDivElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    value() {
      return { top: 0 } as DOMRect;
    },
  });
});

describe('DropContentWrapper', () => {
  it('shows and hides expand button', async () => {
    const user = userEvent.setup();
    const scrollSpy = jest.spyOn(window, 'scrollBy').mockImplementation();
    render(<DropContentWrapper>content</DropContentWrapper>);

    expect(screen.getByText('Show full drop')).toBeInTheDocument();

    await user.click(screen.getByText('Show full drop'));
    expect(screen.queryByText('Show full drop')).toBeNull();
    expect(scrollSpy).toHaveBeenCalled();
    scrollSpy.mockRestore();
  });
});
