import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPageRepNewRep from '@/components/user/rep/new-rep/UserPageRepNewRep';
import { ApiIdentity } from '@/generated/models/ApiIdentity';

jest.mock('@/components/user/rep/new-rep/UserPageRepNewRepSearch', () => ({
  __esModule: true,
  default: ({ onRepSearch }: { onRepSearch: (v: string) => void }) => (
    <button onClick={() => onRepSearch('Art')}>search</button>
  ),
}));

jest.mock('@/components/user/rep/modify-rep/UserPageRepModifyModal', () => ({
  __esModule: true,
  default: () => <div data-testid="modal" />,
}));

describe('UserPageRepNewRep', () => {
  const profile = { id: '1' } as ApiIdentity;
  const repRates = { rating_stats: [] } as any;

  it('opens modal when search selects rep', async () => {
    render(<UserPageRepNewRep profile={profile} repRates={repRates} />);
    await userEvent.click(screen.getByRole('button', { name: 'search' }));
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });
});
