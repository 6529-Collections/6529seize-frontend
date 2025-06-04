import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HeaderProxyNewModal from '../../../../components/header/proxy/HeaderProxyNewModal';

let clickAwayCb: () => void;
let keyPressCb: () => void;

jest.mock('react-use', () => ({
  useClickAway: (_ref: any, cb: () => void) => {
    clickAwayCb = cb;
  },
  useKeyPressEvent: (_key: string, cb: () => void) => {
    keyPressCb = cb;
  },
}));

const connectedProfile = { handle: 'user', pfp: 'user.png' } as any;
const proxyGrantor = { handle: 'grantor', pfp: 'grantor.png' } as any;

describe('HeaderProxyNewModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls onClose when escape is pressed', () => {
    const onClose = jest.fn();
    render(
      <HeaderProxyNewModal
        connectedProfile={connectedProfile}
        proxyGrantor={proxyGrantor}
        onClose={onClose}
      />
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    keyPressCb();
    expect(onClose).toHaveBeenCalledWith(false);
  });

  it('toggles dontShowAgain and passes value on close', () => {
    const onClose = jest.fn();
    render(
      <HeaderProxyNewModal
        connectedProfile={connectedProfile}
        proxyGrantor={proxyGrantor}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByLabelText("Don't show again"));
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledWith(true);
  });

  it('calls onClose when clicking outside', () => {
    const onClose = jest.fn();
    render(
      <HeaderProxyNewModal
        connectedProfile={connectedProfile}
        proxyGrantor={proxyGrantor}
        onClose={onClose}
      />
    );
    clickAwayCb();
    expect(onClose).toHaveBeenCalledWith(false);
  });
});
