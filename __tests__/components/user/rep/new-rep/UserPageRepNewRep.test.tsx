import { render, screen } from '@testing-library/react';
import UserPageRepNewRep from '@/components/user/rep/new-rep/UserPageRepNewRep';
import type { ApiIdentity } from '@/generated/models/ApiIdentity';

jest.mock('@/components/user/rep/new-rep/UserPageRepNewRepSearch', () => ({
  __esModule: true,
  default: () => <div data-testid="search" />,
}));

jest.mock('@/components/user/rep/modify-rep/UserPageRepModifyModal', () => ({
  __esModule: true,
  default: () => <div data-testid="modal" />,
}));

describe('UserPageRepNewRep', () => {
  const profile = { id: '1' } as ApiIdentity;
  const repRates = { rating_stats: [] } as any;

  it('renders search component', () => {
    render(<UserPageRepNewRep profile={profile} repRates={repRates} />);
    expect(screen.getByTestId('search')).toBeInTheDocument();
  });
});
