import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WaveLeaderboardEmptyState } from '../../../../components/waves/leaderboard/drops/WaveLeaderboardEmptyState';

jest.mock('../../../../hooks/useWave', () => ({ useWave: jest.fn(() => ({ isMemesWave: true })) }));
jest.mock('../../../../components/utils/button/PrimaryButton', () => ({ __esModule: true, default: ({ onClicked, children }: any) => <button onClick={onClicked}>{children}</button> }));

describe('WaveLeaderboardEmptyState', () => {
  const wave = {} as any;
  it('shows memes message when memes wave', () => {
    render(<WaveLeaderboardEmptyState wave={wave} onCreateDrop={jest.fn()} />);
    expect(screen.getByText('No artwork submissions yet')).toBeInTheDocument();
  });

  it('shows button otherwise', async () => {
    const { useWave } = require('../../../../hooks/useWave');
    (useWave as jest.Mock).mockReturnValue({ isMemesWave: false });
    const onCreateDrop = jest.fn();
    const user = userEvent.setup();
    render(<WaveLeaderboardEmptyState wave={wave} onCreateDrop={onCreateDrop} />);
    await user.click(screen.getByRole('button'));
    expect(onCreateDrop).toHaveBeenCalled();
    expect(screen.getByText('No drops to show')).toBeInTheDocument();
  });
});
