import React from 'react';
import { render, screen } from '@testing-library/react';
import ProfileActivityLogProfileArchived from '@/components/profile-activity/list/items/ProfileActivityLogProfileArchived';

describe('ProfileActivityLogProfileArchived', () => {
  it('displays handle', () => {
    const log: any = { contents: { handle: 'alice' } };
    render(<ProfileActivityLogProfileArchived log={log} />);
    expect(screen.getByText('profile')).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('archived')).toBeInTheDocument();
  });
});
