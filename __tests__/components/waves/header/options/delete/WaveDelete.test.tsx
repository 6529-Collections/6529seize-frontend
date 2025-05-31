import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WaveDelete from '../../../../../../components/waves/header/options/delete/WaveDelete';

jest.mock('../../../../../../components/utils/animation/CommonAnimationWrapper', () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }));
jest.mock('../../../../../../components/utils/animation/CommonAnimationOpacity', () => ({ __esModule: true, default: ({ children, onClicked }: any) => <div onClick={onClicked}>{children}</div> }));
jest.mock('../../../../../../components/waves/header/options/delete/WaveDeleteModal', () => ({ __esModule: true, default: (props: any) => <div data-testid="modal" onClick={() => props.closeModal()} /> }));

describe('WaveDelete', () => {
  it('opens and closes modal', async () => {
    const user = userEvent.setup();
    render(<WaveDelete wave={{ id: 'w' } as any} />);
    expect(screen.queryByTestId('modal')).toBeNull();
    await user.click(screen.getByRole('menuitem'));
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    await user.click(screen.getByTestId('modal'));
    expect(screen.queryByTestId('modal')).toBeNull();
  });
});
