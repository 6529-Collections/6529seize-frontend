import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateDirectMessage from '../../../../components/waves/create-dm/CreateDirectMessage';
import { useRouter } from 'next/router';
import { useAuth } from '../../../../components/auth/Auth';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('../../../../components/auth/Auth', () => ({
  useAuth: jest.fn(),
}));
jest.mock('../../../../helpers/waves/waves.helpers', () => ({
  createDirectMessageWave: jest.fn().mockResolvedValue({ id: 1 }),
}));

jest.mock(
  '../../../../components/groups/page/create/config/identities/select/GroupCreateIdentitiesSelect',
  () => (props: any) => (
    <button onClick={() => props.onIdentitySelect({ wallet: '0x2' })}>add</button>
  )
);

const push = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push });

function setup() {
  (useAuth as jest.Mock).mockReturnValue({ setToast: jest.fn() });
  render(
    <CreateDirectMessage profile={{ primary_wallet: '0x1' } as any} onBack={() => {}} />
  );
}

describe('CreateDirectMessage', () => {
  it('creates direct message when button clicked', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByText('add'));
    await user.click(screen.getByRole('button', { name: /create/i }));
    expect(push).toHaveBeenCalledWith('/my-stream?view=messages&wave=1', undefined, { shallow: true });
  });
});
