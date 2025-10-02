import { render, act } from '@testing-library/react';
import UserPageHeaderEditClassification from '@/components/user/user-page-header/name/classification/UserPageHeaderEditClassification';
import { ApiIdentity } from '@/generated/models/ApiIdentity';
import { ApiProfileClassification } from '@/generated/models/ApiProfileClassification';
import { AuthContext } from '@/components/auth/Auth';
import { ReactQueryWrapperContext } from '@/components/react-query-wrapper/ReactQueryWrapper';

let capturedSaveProps: any;
let capturedClassificationProps: any;

jest.mock('@/components/user/settings/UserSettingsSave', () => (props: any) => {
  capturedSaveProps = props;
  return <button disabled={props.disabled}>save</button>;
});

jest.mock('@/components/user/settings/UserSettingsClassification', () => (props: any) => {
  capturedClassificationProps = props;
  return <div data-testid="classification" onClick={() => props.onSelect(ApiProfileClassification.Bot)} />;
});

jest.mock('@tanstack/react-query', () => ({
  useMutation: () => ({ mutateAsync: jest.fn() }),
}));

const profile: ApiIdentity = { handle: 'alice', classification: ApiProfileClassification.Pseudonym } as any;

describe('UserPageHeaderEditClassification', () => {
  it('enables save button when classification changes', () => {
    render(
      <AuthContext.Provider value={{ setToast: jest.fn(), requestAuth: jest.fn() } as any}>
        <ReactQueryWrapperContext.Provider value={{ onProfileEdit: jest.fn() } as any}>
          <UserPageHeaderEditClassification profile={profile} onClose={jest.fn()} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
    expect(capturedSaveProps.disabled).toBe(true);

    act(() => {
      capturedClassificationProps.onSelect(ApiProfileClassification.Bot);
    });
    expect(capturedSaveProps.disabled).toBe(false);
});

  it('submits when auth succeeds', async () => {
    const mutate = jest.fn();
    const requestAuth = jest.fn().mockResolvedValue({ success: true });
    const setToast = jest.fn();
    jest.spyOn(require('@tanstack/react-query'), 'useMutation').mockReturnValue({ mutateAsync: mutate } as any);
    const { container } = render(
      <AuthContext.Provider value={{ setToast, requestAuth } as any}>
        <ReactQueryWrapperContext.Provider value={{ onProfileEdit: jest.fn() } as any}>
          <UserPageHeaderEditClassification profile={profile} onClose={jest.fn()} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
    await act(async () => {
      container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true }));
    });
    expect(requestAuth).toHaveBeenCalled();
    expect(mutate).toHaveBeenCalledWith({ handle: 'alice', classification: ApiProfileClassification.Pseudonym });
  });

  it('shows error when auth fails', async () => {
    const mutate = jest.fn();
    const requestAuth = jest.fn().mockResolvedValue({ success: false });
    const setToast = jest.fn();
    jest.spyOn(require('@tanstack/react-query'), 'useMutation').mockReturnValue({ mutateAsync: mutate } as any);
    const { container } = render(
      <AuthContext.Provider value={{ setToast, requestAuth } as any}>
        <ReactQueryWrapperContext.Provider value={{ onProfileEdit: jest.fn() } as any}>
          <UserPageHeaderEditClassification profile={profile} onClose={jest.fn()} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
    await act(async () => {
      container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true }));
    });
    expect(setToast).toHaveBeenCalled();
    expect(mutate).not.toHaveBeenCalled();
  });
});
