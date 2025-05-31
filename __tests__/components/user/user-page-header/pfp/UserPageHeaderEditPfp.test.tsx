import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPageHeaderEditPfp from '../../../../../components/user/user-page-header/pfp/UserPageHeaderEditPfp';
import { AuthContext } from '../../../../../components/auth/Auth';
import { ReactQueryWrapperContext } from '../../../../../components/react-query-wrapper/ReactQueryWrapper';

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-object-url');
global.URL.revokeObjectURL = jest.fn();

jest.mock('react-use', () => ({ useClickAway: jest.fn(), useKeyPressEvent: jest.fn() }));

jest.mock('../../../../../components/user/settings/UserSettingsImgSelectMeme', () => ({
  __esModule: true,
  default: ({ onMeme }: any) => <button data-testid="meme" onClick={() => onMeme({ id: 1, image: 'm' })} />
}));
jest.mock('../../../../../components/user/settings/UserSettingsImgSelectFile', () => ({
  __esModule: true,
  default: (props: any) => <button data-testid="file" onClick={() => props.setFile(new File([new ArrayBuffer(3000000)], 'big.png', { type: 'image/png' }))} />
}));
jest.mock('../../../../../components/user/settings/UserSettingsSave', () => ({
  __esModule: true,
  default: (props: any) => <button data-testid="save" type="submit" disabled={props.disabled}>{props.title}</button>
}));

const mutateAsync = jest.fn();
jest.mock('@tanstack/react-query', () => ({ useMutation: () => ({ mutateAsync }), useQuery: () => ({ data: [] }) }));
jest.mock('../../../../../components/ipfs/IPFSContext', () => ({ useIpfsService: () => ({ addFile: jest.fn() }) }));

const authCtx = { setToast: jest.fn(), requestAuth: jest.fn().mockResolvedValue({ success: true }) } as any;
const queryCtx = { onProfileEdit: jest.fn() } as any;

const profile = { handle: 'me', query: 'me', classification: 'CLASS', pfp: null } as any;

describe('UserPageHeaderEditPfp', () => {
  it('shows error when file too big', async () => {
    render(
      <AuthContext.Provider value={authCtx}>
        <ReactQueryWrapperContext.Provider value={queryCtx}>
          <UserPageHeaderEditPfp profile={profile} onClose={jest.fn()} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
    await userEvent.click(screen.getByTestId('file'));
    await userEvent.click(screen.getByTestId('save'));
    expect(screen.getByText('File size must be less than 2MB')).toBeInTheDocument();
  });

  it('submits selected meme', async () => {
    render(
      <AuthContext.Provider value={authCtx}>
        <ReactQueryWrapperContext.Provider value={queryCtx}>
          <UserPageHeaderEditPfp profile={profile} onClose={jest.fn()} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
    await userEvent.click(screen.getByTestId('meme'));
    await userEvent.click(screen.getByTestId('save'));
    expect(authCtx.requestAuth).toHaveBeenCalled();
    expect(mutateAsync).toHaveBeenCalled();
  });
  it('calls onClose when cancel clicked', async () => {
    const onClose = jest.fn();
    render(
      <AuthContext.Provider value={authCtx}>
        <ReactQueryWrapperContext.Provider value={queryCtx}>
          <UserPageHeaderEditPfp profile={profile} onClose={onClose} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
