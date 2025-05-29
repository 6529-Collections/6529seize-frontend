import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CreateGroupWalletsEmma from 'components/groups/page/create/config/wallets/CreateGroupWalletsEmma';
import { AuthContext } from 'components/auth/Auth';

jest.mock('components/utils/input/emma/EmmaListSearch', () => ({
  __esModule: true,
  default: () => <div data-testid="emma-search" />,
}));

jest.mock('components/groups/page/create/config/wallets/GroupCreateWalletsCount', () => ({
  __esModule: true,
  default: ({ removeWallets }: any) => (
    <button aria-label="remove" onClick={removeWallets}>remove</button>
  ),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [{ wallet: '0xAA' }, { wallet: '0xbb' }], isFetching: false }),
}));

jest.mock('services/distribution-plan-api', () => ({
  distributionPlanApiFetch: jest.fn(() => ({ data: [] })),
}));

describe('CreateGroupWalletsEmma', () => {
  const requestAuth = jest.fn(async () => ({ success: true }));

  it('sets wallets from query data and removes them', () => {
    const setWallets = jest.fn();
    render(
      <AuthContext.Provider value={{ requestAuth, connectedProfile: { handle: 'h' } } as any}>
        <CreateGroupWalletsEmma wallets={null} setWallets={setWallets} />
      </AuthContext.Provider>
    );

    // effect should set wallets lowercased
    expect(setWallets).toHaveBeenCalledWith(['0xaa', '0xbb']);

    fireEvent.click(screen.getByLabelText('remove'));
    expect(setWallets).toHaveBeenCalledWith(null);
  });
});
