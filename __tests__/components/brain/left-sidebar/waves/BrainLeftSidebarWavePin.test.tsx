import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BrainLeftSidebarWavePin from '../../../../../components/brain/left-sidebar/waves/BrainLeftSidebarWavePin';
import { MAX_PINNED_WAVES, usePinnedWavesServer } from '../../../../../hooks/usePinnedWavesServer';
import { useMyStream } from '../../../../../contexts/wave/MyStreamContext';
import { useAuth } from '../../../../../components/auth/Auth';

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock react-tooltip
jest.mock('react-tooltip', () => ({
  Tooltip: ({ children, id }: any) => (
    <div data-testid={`tooltip-${id}`} role="tooltip">
      {children}
    </div>
  ),
}));
jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: () => <svg data-testid="icon" /> }));
jest.mock('../../../../../contexts/wave/MyStreamContext');
jest.mock('../../../../../hooks/usePinnedWavesServer');
jest.mock('../../../../../components/auth/Auth');

const addPinnedWave = jest.fn();
const removePinnedWave = jest.fn();
const mockedUseMyStream = useMyStream as jest.Mock;
const mockedUsePinnedWavesServer = usePinnedWavesServer as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;

function setup(isPinned = false, storedPinned: string[] = []) {
  mockedUseMyStream.mockReturnValue({ waves: { addPinnedWave, removePinnedWave } });
  mockedUsePinnedWavesServer.mockReturnValue({ 
    pinnedIds: storedPinned,
    isOperationInProgress: jest.fn().mockReturnValue(false)
  });
  mockedUseAuth.mockReturnValue({
    setToast: jest.fn()
  });
  localStorage.setItem('pinnedWave', JSON.stringify(storedPinned));
  return render(<BrainLeftSidebarWavePin waveId="1" isPinned={isPinned} />);
}

describe('BrainLeftSidebarWavePin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('unpins wave when already pinned', async () => {
    const user = userEvent.setup();
    setup(true, ['1']);
    await user.click(screen.getByRole('button', { name: /unpin wave/i }));
    expect(removePinnedWave).toHaveBeenCalledWith('1');
    expect(addPinnedWave).not.toHaveBeenCalled();
  });

  it('pins wave when under max limit', async () => {
    const user = userEvent.setup();
    setup(false, []);
    await user.click(screen.getByRole('button', { name: /pin wave/i }));
    expect(addPinnedWave).toHaveBeenCalledWith('1');
    expect(removePinnedWave).not.toHaveBeenCalled();
  });

  it('shows tooltip and does not pin when max limit reached', async () => {
    const user = userEvent.setup();
    const maxList = Array(MAX_PINNED_WAVES).fill('x');
    setup(false, maxList);
    await user.click(screen.getByRole('button', { name: /pin wave/i }));
    expect(addPinnedWave).not.toHaveBeenCalled();
    const tooltip = screen.getByTestId('tooltip-wave-pin-1');
    expect(tooltip).toHaveTextContent(`Max ${MAX_PINNED_WAVES} pinned waves. Unpin another wave first.`);
  });
});
