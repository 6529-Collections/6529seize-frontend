import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPageWavesSearch from '../../../components/user/waves/UserPageWavesSearch';

jest.mock('../../../components/utils/button/PrimaryButton', () => ({
  __esModule: true,
  default: ({ onClicked, children }: any) => (
    <button data-testid="primary" onClick={onClicked}>{children}</button>
  ),
}));

describe('UserPageWavesSearch', () => {
  it('updates wave name on input change', async () => {
    const setWaveName = jest.fn();
    render(
      <UserPageWavesSearch
        waveName={''}
        showCreateNewWaveButton={false}
        setWaveName={setWaveName}
        onCreateNewWave={jest.fn()}
      />
    );

    await userEvent.type(screen.getByRole('textbox'), 'test');
    expect(setWaveName).toHaveBeenCalled();
    expect(setWaveName.mock.calls[setWaveName.mock.calls.length - 1][0]).toBe('t');
  });

  it('clears wave name when clear icon clicked', async () => {
    const setWaveName = jest.fn();
    render(
      <UserPageWavesSearch
        waveName={'abc'}
        showCreateNewWaveButton={false}
        setWaveName={setWaveName}
        onCreateNewWave={jest.fn()}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Clear wave name' }));
    expect(setWaveName).toHaveBeenLastCalledWith(null);
  });

  it('calls onCreateNewWave when button clicked', async () => {
    const onCreateNewWave = jest.fn();
    render(
      <UserPageWavesSearch
        waveName={null}
        showCreateNewWaveButton={true}
        setWaveName={jest.fn()}
        onCreateNewWave={onCreateNewWave}
      />
    );

    await userEvent.click(screen.getByTestId('primary'));
    expect(onCreateNewWave).toHaveBeenCalled();
  });
});
