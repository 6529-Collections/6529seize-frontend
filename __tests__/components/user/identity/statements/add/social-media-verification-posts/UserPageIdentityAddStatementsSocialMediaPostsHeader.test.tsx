import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import UserPageIdentityAddStatementsSocialMediaPostsHeader from '../../../../../../../components/user/identity/statements/add/social-media-verification-posts/UserPageIdentityAddStatementsSocialMediaPostsHeader';

describe('UserPageIdentityAddStatementsSocialMediaPostsHeader', () => {
  it('calls onClose when button clicked', () => {
    const onClose = jest.fn();
    render(<UserPageIdentityAddStatementsSocialMediaPostsHeader onClose={onClose} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalled();
  });
});
