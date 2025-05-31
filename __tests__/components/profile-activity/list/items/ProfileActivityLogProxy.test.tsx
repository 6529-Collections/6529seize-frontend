import { render, screen } from '@testing-library/react';
import React from 'react';
import ProfileActivityLogProxy from '../../../../../components/profile-activity/list/items/ProfileActivityLogProxy';
import { useRouter } from 'next/router';

let linkProps: any;
jest.mock('../../../../../components/user/utils/CommonProfileLink', () => (props: any) => {
  linkProps = props;
  return <div data-testid="link">{props.handleOrWallet}</div>;
});

jest.mock('next/router', () => ({ useRouter: jest.fn() }));

const log = { target_profile_handle: 'bob' } as any;

describe('ProfileActivityLogProxy', () => {
  it('marks link as current user when handle matches', () => {
    (useRouter as jest.Mock).mockReturnValue({ query: { user: 'bob' } });
    render(<ProfileActivityLogProxy log={log} />);
    expect(screen.getByTestId('link')).toHaveTextContent('bob');
    expect(linkProps.isCurrentUser).toBe(true);
  });

  it('marks link as other user when handle differs', () => {
    (useRouter as jest.Mock).mockReturnValue({ query: { user: 'alice' } });
    render(<ProfileActivityLogProxy log={log} />);
    expect(linkProps.isCurrentUser).toBe(false);
  });
});
