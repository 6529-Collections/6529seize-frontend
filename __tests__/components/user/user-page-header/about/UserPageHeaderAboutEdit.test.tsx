import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPageHeaderAboutEdit from '@/components/user/user-page-header/about/UserPageHeaderAboutEdit';
import { AuthContext } from '@/components/auth/Auth';
import { ReactQueryWrapperContext } from '@/components/react-query-wrapper/ReactQueryWrapper';
import { useMutation } from '@tanstack/react-query';

jest.mock('react-use', () => ({ useKeyPressEvent: jest.fn() }));

jest.mock('@tanstack/react-query', () => ({ useMutation: jest.fn() }));
jest.mock('@/services/api/common-api', () => ({ commonApiPost: jest.fn().mockResolvedValue({}) }));
jest.mock('framer-motion', () => ({ AnimatePresence: (props: any) => <div>{props.children}</div> }));
jest.mock('@/components/user/user-page-header/about/UserPageHeaderAboutEditError', () => (props: any) => <div>{props.msg}</div>);

(useMutation as jest.Mock).mockImplementation((opts) => {
  return {
    mutateAsync: async (val: string) => {
      await opts.mutationFn(val);
      opts.onSuccess?.();
      opts.onSettled?.();
    },
  };
});

describe('UserPageHeaderAboutEdit', () => {
  const auth = { requestAuth: jest.fn().mockResolvedValue({ success: true }), setToast: jest.fn() } as any;
  const ctx = { onProfileStatementAdd: jest.fn() } as any;

  it('enables save when value changes and submits', async () => {
    render(
      <AuthContext.Provider value={auth}>
        <ReactQueryWrapperContext.Provider value={ctx}>
          <UserPageHeaderAboutEdit profile={{ query: 'alice' } as any} statement={{ statement_value: 'old' } as any} onClose={jest.fn()} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, 'new');
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn).not.toBeDisabled();
    await userEvent.click(btn);
    expect(auth.requestAuth).toHaveBeenCalled();
  });
});
