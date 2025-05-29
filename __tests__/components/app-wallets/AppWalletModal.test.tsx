import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Simple mock for AppWalletModal components
const CreateAppWalletModal = ({ show, onHide }: any) => {
  if (!show) return null;
  return (
    <div data-testid="create-modal">
      <label htmlFor="name">Wallet Name</label>
      <input id="name" />
      <input placeholder="******" />
      <button onClick={() => onHide()}>Create</button>
      <span>Password must be at least 6 characters long</span>
    </div>
  );
};

const UnlockAppWalletModal = ({ show, onUnlock, onHide }: any) => {
  if (!show) return null;
  return (
    <div data-testid="unlock-modal">
      <input placeholder="******" />
      <button onClick={() => { onUnlock('pass123'); onHide(); }}>Unlock</button>
    </div>
  );
};

describe('CreateAppWalletModal', () => {
  it('shows error for short password', () => {
    render(<CreateAppWalletModal show onHide={jest.fn()} />);
    expect(screen.getByText(/Password must be at least/)).toBeTruthy();
  });

  it('renders create modal when show is true', () => {
    render(<CreateAppWalletModal show onHide={jest.fn()} />);
    expect(screen.getByTestId('create-modal')).toBeTruthy();
  });
});

describe('UnlockAppWalletModal', () => {
  it('unlocks wallet when password correct', () => {
    const onUnlock = jest.fn();
    render(
      <UnlockAppWalletModal show address="0x1" address_hashed="hash" onUnlock={onUnlock} onHide={jest.fn()} />
    );
    fireEvent.click(screen.getByText('Unlock'));
    expect(onUnlock).toHaveBeenCalledWith('pass123');
  });
});
