import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import UserPageIdentityAddStatementsSocialMediaAccountHeader from '@/components/user/identity/statements/add/social-media/UserPageIdentityAddStatementsSocialMediaAccountHeader';

describe('UserPageIdentityAddStatementsSocialMediaAccountHeader', () => {
  it('calls onClose when button clicked', () => {
    const onClose = jest.fn();
    render(<UserPageIdentityAddStatementsSocialMediaAccountHeader onClose={onClose} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalled();
  });
});
