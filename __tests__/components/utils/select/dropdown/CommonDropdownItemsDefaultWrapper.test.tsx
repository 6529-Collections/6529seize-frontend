import { render, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import CommonDropdownItemsDefaultWrapper from '../../../../../components/utils/select/dropdown/CommonDropdownItemsDefaultWrapper';

jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
  motion: { div: (props: any) => <div {...props} /> },
}));

jest.mock('react-use', () => ({
  useClickAway: (ref: React.RefObject<HTMLElement>, handler: () => void) => {
    React.useEffect(() => {
      const listener = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) handler();
      };
      document.addEventListener('mousedown', listener);
      return () => document.removeEventListener('mousedown', listener);
    }, [ref, handler]);
  },
  useKeyPressEvent: (key: string, cb: () => void) => {
    React.useEffect(() => {
      const handler = (e: KeyboardEvent) => e.key === key && cb();
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }, [key, cb]);
  },
}));

test('closes on escape press', () => {
  const setOpen = jest.fn();
  render(
    <CommonDropdownItemsDefaultWrapper isOpen={true} setOpen={setOpen} buttonRef={{ current: null }}>
      <li>item</li>
    </CommonDropdownItemsDefaultWrapper>
  );
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(setOpen).toHaveBeenCalledWith(false);
});

test('positions dropdown when buttonPosition provided', async () => {
  jest.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(40);
  const { container } = render(
    <CommonDropdownItemsDefaultWrapper isOpen={true} setOpen={() => {}} buttonRef={{ current: null }} buttonPosition={{ bottom:0, right:100 }}>
      <li>item</li>
    </CommonDropdownItemsDefaultWrapper>
  );
  await waitFor(() => {
    expect((container.firstChild as HTMLElement).style.left).toBe('60px');
  });
});
