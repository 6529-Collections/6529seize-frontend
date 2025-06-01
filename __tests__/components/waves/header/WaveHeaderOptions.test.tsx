import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WaveHeaderOptions from '../../../../components/waves/header/options/WaveHeaderOptions';

let clickAway: () => void; let escCb: () => void;

jest.mock('react-use', () => ({
  useClickAway: (_ref: any, cb: () => void) => { clickAway = cb; },
  useKeyPressEvent: (_k: string, cb: () => void) => { escCb = cb; },
}));

jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => <div data-animate-presence>{children}</div>,
  motion: { div: (props: any) => <div {...props} /> },
}));

jest.mock('../../../../components/waves/header/options/delete/WaveDelete', () => (props: any) => <div data-testid="delete" data-wave={props.wave.id} />);

const wave = { id: 'w1' } as any;

test('opens and closes options', async () => {
  const user = userEvent.setup();
  const { rerender } = render(<WaveHeaderOptions wave={wave} />);
  const btn = screen.getByRole('button');
  await user.click(btn);
  expect(screen.getByTestId('delete')).toHaveAttribute('data-wave','w1');
  // click away
  clickAway();
  rerender(<WaveHeaderOptions wave={wave} />);
  expect(screen.queryByTestId('delete')).toBeNull();
  // open again and press escape
  await user.click(btn);
  escCb();
  rerender(<WaveHeaderOptions wave={wave} />);
  expect(screen.queryByTestId('delete')).toBeNull();
});
