import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WaveHeaderOptions from '@/components/waves/header/options/WaveHeaderOptions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

let clickAway: () => void; let escCb: () => void;

jest.mock('react-use', () => ({
  useClickAway: (_ref: any, cb: () => void) => { clickAway = cb; },
  useKeyPressEvent: (_k: string, cb: () => void) => { escCb = cb; },
}));

jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => <div data-animate-presence>{children}</div>,
  motion: { div: (props: any) => <div {...props} /> },
}));

jest.mock('@/components/waves/header/options/delete/WaveDelete', () => (props: any) => <div data-testid="delete" data-wave={props.wave.id} />);

jest.mock('@/components/waves/header/options/mute/WaveMute', () => (props: any) => <div data-testid="mute" data-wave={props.wave.id} />);

const wave = { id: 'w1', metrics: { muted: false } } as any;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

test('opens and closes options', async () => {
  const user = userEvent.setup();
  const { rerender } = render(<WaveHeaderOptions wave={wave} />, { wrapper: createWrapper() });
  const btn = screen.getByRole('button');
  await user.click(btn);
  expect(screen.getByTestId('delete')).toHaveAttribute('data-wave','w1');
  expect(screen.getByTestId('mute')).toHaveAttribute('data-wave','w1');
  clickAway();
  rerender(<WaveHeaderOptions wave={wave} />);
  expect(screen.queryByTestId('delete')).toBeNull();
  await user.click(btn);
  escCb();
  rerender(<WaveHeaderOptions wave={wave} />);
  expect(screen.queryByTestId('delete')).toBeNull();
});
