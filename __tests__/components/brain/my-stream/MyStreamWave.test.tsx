import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import MyStreamWave from '../../../../components/brain/my-stream/MyStreamWave';
import { MyStreamWaveTab } from '../../../../types/waves.types';

jest.mock('../../../../components/brain/my-stream/MyStreamWaveChat', () => ({
  __esModule: true,
  default: () => <div data-testid="chat" />,
}));

jest.mock('../../../../components/brain/my-stream/MyStreamWaveLeaderboard', () => ({
  __esModule: true,
  default: ({ onDropClick }: any) => (
    <button data-testid="leaderboard" onClick={() => onDropClick({ id: 'd1' })}>
      leaderboard
    </button>
  ),
}));

jest.mock('../../../../components/brain/my-stream/MyStreamWaveOutcome', () => ({
  __esModule: true,
  default: () => <div data-testid="outcome" />,
}));

jest.mock('../../../../components/waves/winners/WaveWinners', () => ({
  __esModule: true,
  WaveWinners: ({ onDropClick }: any) => (
    <button data-testid="winners" onClick={() => onDropClick({ id: 'd1' })}>
      winners
    </button>
  ),
}));

jest.mock('../../../../components/brain/my-stream/votes/MyStreamWaveMyVotes', () => ({
  __esModule: true,
  default: () => <div data-testid="myvotes" />,
}));

jest.mock('../../../../components/brain/my-stream/MyStreamWaveFAQ', () => ({
  __esModule: true,
  default: () => <div data-testid="faq" />,
}));

jest.mock('../../../../components/brain/my-stream/tabs/MyStreamWaveTabs', () => ({
  __esModule: true,
  MyStreamWaveTabs: ({ wave }: any) => <div data-testid="tabs">{wave.id}</div>,
}));

const useContentTab = jest.fn();
jest.mock('../../../../components/brain/ContentTabContext', () => ({
  useContentTab: (...args: any[]) => useContentTab(...args),
}));

const useWaveData = jest.fn();
jest.mock('../../../../hooks/useWaveData', () => ({
  useWaveData: (...args: any[]) => useWaveData(...args),
}));

const mockRouterPush = jest.fn();
let mockRouter: any = { query: { wave: '1' }, pathname: '/path', push: mockRouterPush };
jest.mock('next/router', () => ({ useRouter: () => mockRouter }));

let mockBreakpoint = 'LG';
jest.mock('react-use', () => ({ createBreakpoint: () => () => mockBreakpoint }));

const wave = { id: '1', wave: {} } as any;

describe('MyStreamWave', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouterPush.mockClear();
    mockRouter = { query: { wave: '1' }, pathname: '/path', push: mockRouterPush };
    mockBreakpoint = 'LG';
  });

  it('returns null when no wave data', () => {
    useWaveData.mockReturnValue({ data: undefined });
    useContentTab.mockReturnValue({ activeContentTab: MyStreamWaveTab.CHAT });
    const { container } = render(<MyStreamWave waveId="1" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders leaderboard tab and handles drop click', () => {
    useWaveData.mockReturnValue({ data: wave });
    useContentTab.mockReturnValue({ activeContentTab: MyStreamWaveTab.LEADERBOARD });
    render(<MyStreamWave waveId="1" />);
    expect(screen.getByTestId('tabs')).toHaveTextContent('1');
    fireEvent.click(screen.getByTestId('leaderboard'));
    expect(mockRouterPush).toHaveBeenCalledWith(
      { pathname: '/path', query: { wave: '1', drop: 'd1' } },
      undefined,
      { shallow: true }
    );
  });

  it('hides tabs when breakpoint is small', () => {
    mockBreakpoint = 'S';
    useWaveData.mockReturnValue({ data: wave });
    useContentTab.mockReturnValue({ activeContentTab: MyStreamWaveTab.CHAT });
    render(<MyStreamWave waveId="1" />);
    expect(screen.queryByTestId('tabs')).toBeNull();
  });
});
