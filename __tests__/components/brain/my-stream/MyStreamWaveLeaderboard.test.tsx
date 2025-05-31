import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import MyStreamWaveLeaderboard from '../../../../components/brain/my-stream/MyStreamWaveLeaderboard';
import { ApiWave } from '../../../../generated/models/ApiWave';
import { WaveDropsLeaderboardSort } from '../../../../hooks/useWaveDropsLeaderboard';

const useWave = jest.fn();
const useLayout = jest.fn();
const useLocalPreference = jest.fn();

jest.mock('../../../../hooks/useWave', () => ({ useWave: (...args: any[]) => useWave(...args) }));
jest.mock('../../../../components/brain/my-stream/layout/LayoutContext', () => ({ useLayout: (...args: any[]) => useLayout(...args) }));
jest.mock('../../../../hooks/useLocalPreference', () => (...args: any[]) => useLocalPreference(...args));

jest.mock('../../../../components/waves/leaderboard/WaveLeaderboardTime', () => ({ WaveLeaderboardTime: () => <div data-testid="time" /> }));
let headerProps: any;
jest.mock('../../../../components/waves/leaderboard/header/WaveleaderboardHeader', () => ({ WaveLeaderboardHeader: (props: any) => { headerProps = props; return <button data-testid="header" onClick={() => props.onCreateDrop()} />; } }));
jest.mock('../../../../components/waves/leaderboard/create/WaveDropCreate', () => ({ WaveDropCreate: (props: any) => <div data-testid="create-drop" onClick={props.onCancel} /> }));
jest.mock('../../../../components/waves/leaderboard/drops/WaveLeaderboardDrops', () => ({ WaveLeaderboardDrops: (props: any) => <div data-testid="drops" onClick={() => props.onCreateDrop()} /> }));
jest.mock('../../../../components/waves/leaderboard/gallery/WaveLeaderboardGallery', () => ({ WaveLeaderboardGallery: () => <div data-testid="gallery" /> }));
jest.mock('../../../../components/waves/memes/MemesArtSubmissionModal', () => (props: any) => props.isOpen ? <div data-testid="memes" /> : null);

const wave = { id: '1', participation: {} } as ApiWave;

describe('MyStreamWaveLeaderboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLayout.mockReturnValue({ leaderboardViewStyle: {} });
    useLocalPreference.mockImplementation((_: any, def: any) => [def, jest.fn()]);
  });

  it('uses list view for non memes wave and can open drop create', async () => {
    const user = userEvent.setup();
    useWave.mockReturnValue({ isMemesWave: false });
    useLocalPreference.mockReturnValueOnce(['list', jest.fn()]); // view mode
    useLocalPreference.mockReturnValueOnce([WaveDropsLeaderboardSort.RANK, jest.fn()]); // sort
    render(<MyStreamWaveLeaderboard wave={wave} onDropClick={jest.fn()} />);

    expect(headerProps.viewMode).toBe('list');
    await user.click(screen.getByTestId('header'));
    expect(screen.getByTestId('create-drop')).toBeInTheDocument();
  });

  it('uses grid view for memes wave and opens meme modal', async () => {
    const user = userEvent.setup();
    useWave.mockReturnValue({ isMemesWave: true });
    useLocalPreference.mockReturnValueOnce(['grid', jest.fn()]);
    useLocalPreference.mockReturnValueOnce([WaveDropsLeaderboardSort.RANK, jest.fn()]);
    render(<MyStreamWaveLeaderboard wave={wave} onDropClick={jest.fn()} />);

    expect(headerProps.viewMode).toBe('grid');
    await user.click(screen.getByTestId('header'));
    expect(screen.getByTestId('memes')).toBeInTheDocument();
  });
});

