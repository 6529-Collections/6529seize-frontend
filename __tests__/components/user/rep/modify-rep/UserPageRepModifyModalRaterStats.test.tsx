import { render, screen } from '@testing-library/react';
import UserPageRepModifyModalRaterStats from '../../../../../components/user/rep/modify-rep/UserPageRepModifyModalRaterStats';
import { AuthContext } from '../../../../../components/auth/Auth';

jest.mock('../../../../../helpers/Helpers', () => ({
  formatNumberWithCommas: (n: number) => `#${n}`,
}));

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));

describe('UserPageRepModifyModalRaterStats', () => {
  const repState = { category: 'nic' } as any;
  const minMaxValues = { min: 1, max: 2 };

  function renderComp(ctx: any, heroCredit: number) {
    return render(
      <AuthContext.Provider value={ctx as any}>
        <UserPageRepModifyModalRaterStats repState={repState} minMaxValues={minMaxValues} heroAvailableCredit={heroCredit} />
      </AuthContext.Provider>
    );
  }

  it('shows hero credit when no proxy', () => {
    renderComp({ activeProfileProxy: null }, 10);
    expect(screen.getByText('#10')).toBeInTheDocument();
    expect(screen.getByText('+/- #2')).toBeInTheDocument();
  });

  it('shows proxy info and credit', () => {
    const proxy = { created_by: { handle: 'alice' }, actions: [{ action_type: 'ALLOCATE_REP', credit_amount: 30, credit_spent: 10 }] };
    renderComp({ activeProfileProxy: proxy }, 100);
    expect(screen.getByText('alice')).toBeInTheDocument();
    // proxy available credit is 20 which is less than hero credit
    expect(screen.getByText('#20')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
  });
});
