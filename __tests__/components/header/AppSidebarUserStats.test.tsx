import React from 'react';
import { render, screen } from '@testing-library/react';
import AppSidebarUserStats from '@/components/header/AppSidebarUserStats';
import { QueryKey } from '@/components/react-query-wrapper/ReactQueryWrapper';

const useQueryMock = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useQuery: (...args: any[]) => useQueryMock(...args),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

jest.mock('@/services/api/common-api', () => ({
  commonApiFetch: jest.fn(),
}));

const { commonApiFetch } = require('@/services/api/common-api');

beforeEach(() => {
  useQueryMock.mockReset();
  (commonApiFetch as jest.Mock).mockReset();
});

describe('AppSidebarUserStats', () => {
  it('fetches follower count and displays values', () => {
    useQueryMock.mockImplementation(({ queryKey, queryFn, enabled }) => {
      expect(queryKey).toEqual([
        QueryKey.IDENTITY_FOLLOWERS,
        { profile_id: 'p1', page_size: 1 },
      ]);
      expect(enabled).toBe(true);
      (commonApiFetch as jest.Mock).mockResolvedValue({ count: 5 });
      // invoke queryFn to verify it calls the api
      queryFn();
      return { data: { count: 5 } };
    });

    render(<AppSidebarUserStats handle="alice" tdh={1500} rep={2} profileId="p1" />);

    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: `identity-subscriptions/incoming/IDENTITY/p1`,
      params: { page_size: '1' },
    });

    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Followers')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Followers/ })!.getAttribute('href')).toBe('/alice/followers');
  });

  it('disables query when profileId is missing', () => {
    useQueryMock.mockImplementation(({ enabled }) => {
      expect(enabled).toBe(false);
      return { data: undefined };
    });

    render(<AppSidebarUserStats handle="bob" tdh={10} rep={20} profileId={undefined} />);

    expect(commonApiFetch).not.toHaveBeenCalled();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Followers')).toBeInTheDocument();
  });

  it('uses singular follower label', () => {
    useQueryMock.mockReturnValue({ data: { count: 1 } });

    render(<AppSidebarUserStats handle="carol" tdh={1} rep={0} profileId="pid" />);

    const link = screen.getByRole('link', { name: /Follower/ });
    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent('1');
  });
});
