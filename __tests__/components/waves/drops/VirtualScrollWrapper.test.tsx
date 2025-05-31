import React from 'react';
import { render, act } from '@testing-library/react';
import VirtualScrollWrapper from '../../../../components/waves/drops/VirtualScrollWrapper';
import { DropSize } from '../../../../helpers/waves/drop.helpers';
import { useMyStream } from "../../../../contexts/wave/MyStreamContext";

jest.useFakeTimers();

const observe = jest.fn();
const unobserve = jest.fn();
let intersectionCb: (entries: any[]) => void = () => {};

beforeAll(() => {
  (global as any).IntersectionObserver = class {
    constructor(cb: any) {
      intersectionCb = cb;
    }
    observe = observe;
    unobserve = unobserve;
    disconnect() {}
  };
});

afterEach(() => {
  observe.mockClear();
  unobserve.mockClear();
});

jest.mock('../../../../contexts/wave/MyStreamContext', () => ({
  useMyStream: jest.fn(() => ({ fetchAroundSerialNo: jest.fn() })),
}));

function setup(size: DropSize) {
  const scrollRef = { current: document.createElement('div') };
  const { container } = render(
    <VirtualScrollWrapper
      scrollContainerRef={scrollRef}
      delay={1000}
      dropSerialNo={1}
      waveId="wave"
      type={size}
    >
      <div data-testid="child">content</div>
    </VirtualScrollWrapper>
  );
  return { container, scrollRef };
}

test('renders placeholder when out of view', () => {
  const { container } = setup(DropSize.FULL);
  const div = container.firstChild as HTMLElement;
  Object.defineProperty(div, 'getBoundingClientRect', {
    value: () => ({ height: 123 }),
  });

  act(() => {
    jest.advanceTimersByTime(1000);
  });

  act(() => {
    intersectionCb([{ isIntersecting: false } as any]);
  });

  const placeholder = div.firstChild as HTMLElement;
  expect(placeholder.getAttribute('style')).toContain('height: 123');
});

test('fetches light drop when entering view', () => {
  const fetchAroundSerialNo = jest.fn();
  const module = require('../../../../contexts/wave/MyStreamContext');
  (module.useMyStream as jest.Mock).mockReturnValue({ fetchAroundSerialNo });
  setup(DropSize.LIGHT);
  act(() => {
    intersectionCb([{ isIntersecting: true } as any]);
  });
  expect(fetchAroundSerialNo).toHaveBeenCalledWith('wave', 1);
});
