import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import UserPageRepNewRepSearchHeader from '../../../../../components/user/rep/new-rep/UserPageRepNewRepSearchHeader';
import { AuthContext } from '../../../../../components/auth/Auth';
import { useQuery } from '@tanstack/react-query';
import { ApiProfileProxyActionType } from '../../../../../generated/models/ApiProfileProxyActionType';

jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));
jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));
jest.mock('../../../../../components/utils/CommonInfoBox', () => (p: any) => <div data-testid="infobox">{p.message}</div>);

const useQueryMock = useQuery as jest.Mock;

describe('UserPageRepNewRepSearchHeader', () => {
  const profile = { handle: 'bob', query: 'bob' } as any;
  const repRates = { rep_rates_left_for_rater: 5, total_rep_rating_by_rater: 3 } as any;

  it('shows available rep when no proxy', () => {
    useQueryMock.mockReturnValue({});
    render(
      <AuthContext.Provider value={{ activeProfileProxy: null } as any}>
        <UserPageRepNewRepSearchHeader repRates={repRates} profile={profile} />
      </AuthContext.Provider>
    );
    expect(screen.getByText('Your available Rep:')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows proxy info and info box when credit is zero', async () => {
    useQueryMock.mockReturnValue({ data: { rep_rates_left_for_rater: 0, total_rep_rating_by_rater: 0 } });
    const proxy = {
      created_by: { handle: 'alice' },
      actions: [{ action_type: ApiProfileProxyActionType.AllocateRep, credit_amount: 1, credit_spent: 1 }],
    } as any;
    render(
      <AuthContext.Provider value={{ activeProfileProxy: proxy } as any}>
        <UserPageRepNewRepSearchHeader repRates={repRates} profile={profile} />
      </AuthContext.Provider>
    );
    await waitFor(() => expect(screen.getByText('You are acting as proxy for:')).toBeInTheDocument());
    expect(screen.getByRole('link')).toHaveAttribute('href', '/alice');
    expect(screen.getByTestId('infobox')).toHaveTextContent("You don't have any rep left to rate");
  });
});
