import { render, screen } from '@testing-library/react';
import React from 'react';
import UserPageFollowers from '@/components/user/user-page-header/followers/UserPageFollowers';
import { useQuery } from '@tanstack/react-query';

jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));

jest.mock('@/components/distribution-plan-tool/common/CircleLoader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
  CircleLoaderSize: { SMALL: 'SMALL' }
}));

jest.mock('@/helpers/Helpers', () => ({
  formatNumberWithCommas: (n: number) => `fmt-${n}`
}));

const useQueryMock = useQuery as jest.Mock;

const profile = { id: '1', handle: 'alice' } as any;

function renderComponent(data: any, fetching = false) {
  useQueryMock.mockReturnValue({ data, isFetching: fetching });
  return render(<UserPageFollowers profile={profile} />);
}

describe('UserPageFollowers header component', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows loader when fetching', () => {
    renderComponent({ count: 2 }, true);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('renders follower count and link', () => {
    renderComponent({ count: 1 }, false);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/alice/followers');
    expect(screen.getByText('fmt-1')).toBeInTheDocument();
    expect(screen.getByText('Follower')).toBeInTheDocument();
  });

  it('pluralizes followers correctly', () => {
    renderComponent({ count: 5 }, false);
    expect(screen.getByText('Followers')).toBeInTheDocument();
  });
});
