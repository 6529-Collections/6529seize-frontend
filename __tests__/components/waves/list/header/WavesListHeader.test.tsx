import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WavesListHeader from '@/components/waves/list/header/WavesListHeader';
import { AuthContext } from '@/components/auth/Auth';

jest.mock('@/components/waves/list/header/WavesListSearch', () => (props: any) => <div data-testid="search" />);

const baseAuth = { connectedProfile: { handle: 'bob' }, activeProfileProxy: null } as any;

describe('WavesListHeader', () => {
  it('sets identity when my waves clicked', async () => {
    const setIdentity = jest.fn();
    const user = userEvent.setup();
    render(
      <AuthContext.Provider value={baseAuth}>
        <WavesListHeader identity={null} waveName={null} onCreateNewWave={jest.fn()} onCreateNewDirectMessage={jest.fn()} setIdentity={setIdentity} setWaveName={jest.fn()} showCreateNewButton={false} />
      </AuthContext.Provider>
    );
    await user.click(screen.getByText('My Waves'));
    expect(setIdentity).toHaveBeenCalledWith('bob');
  });

  it('shows create buttons when enabled', () => {
    render(
      <AuthContext.Provider value={baseAuth}>
        <WavesListHeader identity={null} waveName={null} onCreateNewWave={jest.fn()} onCreateNewDirectMessage={jest.fn()} setIdentity={jest.fn()} setWaveName={jest.fn()} showCreateNewButton={true} />
      </AuthContext.Provider>
    );
    expect(screen.getByText('Create Wave')).toBeInTheDocument();
    expect(screen.getByText('Create DM')).toBeInTheDocument();
  });
});
