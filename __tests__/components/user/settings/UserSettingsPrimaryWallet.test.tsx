import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import UserSettingsPrimaryWallet from '../../../../components/user/settings/UserSettingsPrimaryWallet';

let clickAway: () => void;
let escapeCb: () => void;

jest.mock('react-use', () => ({
  useClickAway: (_ref: any, cb: () => void) => { clickAway = cb; },
  useKeyPressEvent: (key: string, cb: () => void) => { if (key === 'Escape') escapeCb = cb; },
}));

jest.mock('framer-motion', () => ({
  motion: { div: (p: any) => <div {...p} /> },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
  useAnimate: () => [{ current: document.createElement('div') }, jest.fn()],
}));

let items: any[] = [];
jest.mock('../../../../components/user/settings/UserSettingsPrimaryWalletItem', () => (props: any) => { items.push(props); return <li data-testid="item" onClick={() => props.onSelect(props.wallet.wallet)}>{props.wallet.display}</li>; });

describe('UserSettingsPrimaryWallet', () => {
  const wallets = [
    { wallet: '0x1', display: 'One', tdh: 0 },
    { wallet: '0x2', display: 'Two', tdh: 0 },
  ];
  beforeEach(() => { items = []; });

  it('opens dropdown and selects wallet', async () => {
    const onSelect = jest.fn();
    render(<UserSettingsPrimaryWallet wallets={wallets as any} selected="0x1" onSelect={onSelect} />);
    const btn = screen.getByRole('button');
    await userEvent.click(btn);
    expect(screen.getAllByTestId('item')).toHaveLength(2);
    await userEvent.click(screen.getAllByTestId('item')[1]);
    expect(onSelect).toHaveBeenCalledWith('0x2');
    expect(screen.queryAllByTestId('item')).toHaveLength(0);
  });

  it('closes on escape and click away', async () => {
    render(<UserSettingsPrimaryWallet wallets={wallets as any} selected="0x1" onSelect={() => {}} />);
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getAllByTestId('item')).toHaveLength(2);
    escapeCb();
    await waitFor(() => expect(screen.queryAllByTestId('item')).toHaveLength(0));
    await userEvent.click(screen.getByRole('button'));
    clickAway();
    await waitFor(() => expect(screen.queryAllByTestId('item')).toHaveLength(0));
  });
});
