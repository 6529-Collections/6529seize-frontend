import { render, fireEvent, act } from '@testing-library/react';
import React from 'react';
import DropMobileMenuHandler from '../../../../components/waves/drops/DropMobileMenuHandler';
import { DropSize } from '../../../../helpers/waves/drop.helpers';

jest.mock('../../../../hooks/isMobileDevice', () => () => true);

jest.mock('../../../../components/waves/drops/WaveDropMobileMenu', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="menu" data-open={props.isOpen} onClick={() => props.onReply()} />
  ),
}));

const drop = { id: 'drop', type: DropSize.FULL } as any;

test('opens menu on long press', () => {
  jest.useFakeTimers();
  const { getByTestId } = render(
    <DropMobileMenuHandler drop={drop} showReplyAndQuote onReply={jest.fn()} onQuote={jest.fn()}>
      <div data-testid="child" />
    </DropMobileMenuHandler>
  );
  fireEvent.touchStart(getByTestId('child'), { touches: [{ clientX:0, clientY:0 }] });
  act(() => {
    jest.advanceTimersByTime(600);
  });
  const menu = getByTestId('menu');
  expect(menu.getAttribute('data-open')).toBe('true');
  fireEvent.click(menu);
  expect(menu.getAttribute('data-open')).toBe('false');
});
