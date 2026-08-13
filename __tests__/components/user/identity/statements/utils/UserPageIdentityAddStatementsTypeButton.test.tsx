import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPageIdentityAddStatementsTypeButton from '@/components/user/identity/statements/utils/UserPageIdentityAddStatementsTypeButton';
import { STATEMENT_TYPE } from '@/helpers/Types';

jest.mock('@/components/user/utils/icons/SocialStatementIcon', () => ({
  __esModule: true,
  default: () => <div data-testid="icon" />,
}));

describe('UserPageIdentityAddStatementsTypeButton', () => {
  it('applies correct classes based on props and handles click', async () => {
    const onClick = jest.fn();
    const { rerender, getByRole } = render(
      <UserPageIdentityAddStatementsTypeButton
        statementType={STATEMENT_TYPE.X}
        isActive={false}
        onClick={onClick}
      />
    );
    const button = getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button.className).toContain('tw-bg-white/[0.035]');
    expect(button.className).toContain('tw-min-h-12');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalled();

    rerender(
      <UserPageIdentityAddStatementsTypeButton
        statementType={STATEMENT_TYPE.X}
        isActive={true}
        onClick={onClick}
      />
    );
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button.className).toContain('tw-bg-primary-500/10');
  });
});
