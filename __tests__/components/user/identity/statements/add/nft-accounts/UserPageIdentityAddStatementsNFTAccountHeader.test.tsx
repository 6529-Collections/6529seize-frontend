import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import UserPageIdentityAddStatementsNFTAccountHeader from '@/components/user/identity/statements/add/nft-accounts/UserPageIdentityAddStatementsNFTAccountHeader';

describe('UserPageIdentityAddStatementsNFTAccountHeader', () => {
  it('renders title and handles close', async () => {
    const onClose = jest.fn();
    render(<UserPageIdentityAddStatementsNFTAccountHeader onClose={onClose} />);
    expect(screen.getByText('Add NFT Account')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
