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
        isFirst={true}
        isLast={false}
        onClick={onClick}
      />
    );
    const button = getByRole('button');
    expect(button.className).toContain('tw-bg-transparent');
    expect(button.className).toContain('tw-rounded-l-md');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalled();

    rerender(
      <UserPageIdentityAddStatementsTypeButton
        statementType={STATEMENT_TYPE.X}
        isActive={true}
        isFirst={false}
        isLast={true}
        onClick={onClick}
      />
    );
    expect(button.className).toContain('tw-bg-iron-800');
    expect(button.className).toContain('tw-rounded-r-md');
  });
});
