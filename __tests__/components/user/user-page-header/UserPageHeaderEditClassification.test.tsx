import { render, act } from '@testing-library/react';
import UserPageHeaderEditClassification from '../../../../components/user/user-page-header/name/classification/UserPageHeaderEditClassification';
import { ApiIdentity } from '../../../../generated/models/ApiIdentity';
import { ApiProfileClassification } from '../../../../generated/models/ApiProfileClassification';
import { AuthContext } from '../../../../components/auth/Auth';
import { ReactQueryWrapperContext } from '../../../../components/react-query-wrapper/ReactQueryWrapper';

let capturedSaveProps: any;
let capturedClassificationProps: any;

jest.mock('../../../../components/user/settings/UserSettingsSave', () => (props: any) => {
  capturedSaveProps = props;
  return <button disabled={props.disabled}>save</button>;
});

jest.mock('../../../../components/user/settings/UserSettingsClassification', () => (props: any) => {
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
});
