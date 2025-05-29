import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPageIdentityStatementsStatement from '../../../../../../components/user/identity/statements/utils/UserPageIdentityStatementsStatement';
import { STATEMENT_TYPE } from '../../../../../../helpers/Types';
import { useRouter } from 'next/router';

jest.mock('../../../../../../components/user/identity/statements/utils/UserPageIdentityDeleteStatementButton', () => ({
  __esModule: true,
  default: () => <div data-testid="delete-button" />,
}));

jest.mock('@tippyjs/react', () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }));

jest.mock('react-use', () => ({ useCopyToClipboard: () => [null, jest.fn()] }));
jest.mock('next/router', () => ({ useRouter: jest.fn() }));

const mockedUseRouter = useRouter as jest.Mock;

function setMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockReturnValue({ matches, addListener: jest.fn(), removeListener: jest.fn() }),
  });
}

describe('UserPageIdentityStatementsStatement', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockedUseRouter.mockReturnValue({ isReady: true });
    setMatchMedia(false);
  });

it.skip("copies text when copy button clicked", async () => {
    const statement = { statement_value: 'http://x.com', statement_type: STATEMENT_TYPE.X } as any;
    const profile = {} as any;
    render(<UserPageIdentityStatementsStatement statement={statement} profile={profile} canEdit={false} />);
    await userEvent.click(screen.getByRole('button', { name: /copy/i }));
    expect(screen.getByText('Copied!')).toBeTruthy();
    await act(() => {
      jest.advanceTimersByTime(1000);
      jest.runOnlyPendingTimers();
    });
    expect(screen.getByText('http://x.com')).toBeTruthy();
}, 10000);

  it('shows external link when canOpen is true', () => {
    const statement = { statement_value: 'http://x.com', statement_type: STATEMENT_TYPE.X } as any;
    const profile = {} as any;
    render(<UserPageIdentityStatementsStatement statement={statement} profile={profile} canEdit={false} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', 'http://x.com');
  });
});
