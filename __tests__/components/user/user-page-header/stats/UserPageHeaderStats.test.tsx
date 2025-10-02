import { render, screen } from '@testing-library/react';
import React from 'react';
import UserPageHeaderStats from '@/components/user/user-page-header/stats/UserPageHeaderStats';
import { useParams } from 'next/navigation';

jest.mock('next/navigation', () => ({ useParams: jest.fn() }));

jest.mock('@/components/user/user-page-header/followers/UserPageFollowers', () => (props: any) => {
  capturedProps = props;
  return <div data-testid="followers" />;
});

jest.mock('@/helpers/Helpers', () => ({
  formatNumberWithCommas: (n: number) => `fmt-${n}`
}));

let capturedProps: any = null;
const useParamsMock = useParams as jest.Mock;

describe('UserPageHeaderStats', () => {
  beforeEach(() => {
    capturedProps = null;
    useParamsMock.mockReturnValue({ user: 'bob' });
  });

  it('renders TDH and Rep links with numbers and passes profile to followers', () => {
    const profile: any = { handle: 'bob', tdh: 10, rep: 20 };
    render(<UserPageHeaderStats profile={profile} />);
    expect(screen.getByRole('link', { name: 'fmt-10 TDH' })).toHaveAttribute('href', '/bob/collected');
    expect(screen.getByRole('link', { name: 'fmt-20 Rep' })).toHaveAttribute('href', '/bob/rep');
    expect(screen.getByText('fmt-10')).toBeInTheDocument();
    expect(screen.getByText('fmt-20')).toBeInTheDocument();
    expect(screen.getByTestId('followers')).toBeInTheDocument();
    expect(capturedProps.profile).toBe(profile);
  });
});
