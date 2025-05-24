import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BrainLeftSidebarWavePin from '../../../../../components/brain/left-sidebar/waves/BrainLeftSidebarWavePin';
import { MAX_PINNED_WAVES } from '../../../../../hooks/usePinnedWaves';
import { useMyStream } from '../../../../../contexts/wave/MyStreamContext';
import { usePinnedWaves } from '../../../../../hooks/usePinnedWaves';

jest.mock('@tippyjs/react', () => (props: any) => <div data-testid="tippy" data-content={props.content}>{props.children}</div>);
jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: () => <svg data-testid="icon" /> }));
jest.mock('../../../../../contexts/wave/MyStreamContext');
jest.mock('../../../../../hooks/usePinnedWaves');

const addPinnedWave = jest.fn();
const removePinnedWave = jest.fn();
const mockedUseMyStream = useMyStream as jest.Mock;
const mockedUsePinnedWaves = usePinnedWaves as jest.Mock;

function setup(isPinned = false, storedPinned: string[] = []) {
  mockedUseMyStream.mockReturnValue({ waves: { addPinnedWave, removePinnedWave } });
  mockedUsePinnedWaves.mockReturnValue({ pinnedIds: [] });
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
    const tippy = screen.getByTestId('tippy');
    expect(tippy).toHaveAttribute('data-content', `Max ${MAX_PINNED_WAVES} pinned waves. Unpin another wave first.`);
  });
});
