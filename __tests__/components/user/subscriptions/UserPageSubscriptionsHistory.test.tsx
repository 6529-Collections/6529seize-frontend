import { render, screen } from '@testing-library/react';
import UserPageSubscriptionsHistory from '@/components/user/subscriptions/UserPageSubscriptionsHistory';
import type { Page } from '@/helpers/Types';

const page = <T,>(data: T[]): Page<T> => ({ count: data.length, page: 1, next: false, data });

describe('UserPageSubscriptionsHistory', () => {
  it('renders accordions with entries', () => {
    render(
      <UserPageSubscriptionsHistory
        topups={page([{ hash: 'h', amount: 1, from_wallet: 'a', transaction_date: '2020-01-01' } as any])}
        redeemed={page([{ transaction: 'tx', token_id: 1, contract: '0x1', address: 'b', balance_after: 1, created_at: '2020-01-01' } as any])}
        logs={page([{ id: 1, log: 'log', created_at: '2020-01-01' } as any])}
        setRedeemedPage={() => {}}
        setTopUpPage={() => {}}
        setLogsPage={() => {}}
      />
    );
    expect(screen.getByText('Subscription History')).toBeInTheDocument();
    expect(screen.getByText('Redeemed Subscriptions')).toBeInTheDocument();
    expect(screen.getByText('Log History')).toBeInTheDocument();
    expect(screen.getByText('Top Up History')).toBeInTheDocument();
  });
});
