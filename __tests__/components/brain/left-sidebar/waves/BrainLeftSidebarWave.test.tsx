import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BrainLeftSidebarWave from '@/components/brain/left-sidebar/waves/BrainLeftSidebarWave';
import { ApiWaveType } from '@/generated/models/ApiWaveType';
import { usePrefetchWaveData } from '@/hooks/usePrefetchWaveData';
import { useMyStream } from '@/contexts/wave/MyStreamContext';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, onMouseEnter, onClick, className }: any) => (
    <a href={href} onMouseEnter={onMouseEnter} onClick={onClick} className={className}>{children}</a>
  ),
}));
jest.mock('@/hooks/useDeviceInfo', () => ({
  __esModule: true,
  default: () => ({ isApp: false }),
}));
jest.mock('@/contexts/wave/MyStreamContext', () => ({
  useMyStream: jest.fn(),
}));
jest.mock('@/hooks/usePrefetchWaveData');
jest.mock('@/components/waves/WavePicture', () => (props: any) => <img data-testid="wave-picture" alt={props.name} />);
jest.mock('@/components/brain/left-sidebar/waves/BrainLeftSidebarWaveDropTime', () => (props: any) => <span data-testid="drop-time">{props.time}</span>);
jest.mock('@/components/brain/left-sidebar/waves/BrainLeftSidebarWavePin', () => (props: any) => <div data-testid="pin">{String(props.isPinned)}</div>);

const mockedPrefetch = usePrefetchWaveData as jest.Mock;
const mockedUseMyStream = useMyStream as jest.Mock;

describe('BrainLeftSidebarWave', () => {
  const prefetch = jest.fn();
  const onHover = jest.fn();
  const setActiveWave = jest.fn();
  let activeWaveId: string | null = null;

  const baseWave = {
    id: '1',
    type: ApiWaveType.Chat,
    name: 'Chat Wave',
    picture: '',
    contributors: [],
    newDropsCount: { count: 2, latestDropTimestamp: 123 },
    isPinned: false,
    unreadDropsCount: 0,
    latestReadTimestamp: 0,
    firstUnreadDropSerialNo: null,
    isMuted: false,
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedPrefetch.mockReturnValue(prefetch);
    activeWaveId = null;
    mockedUseMyStream.mockImplementation(() => ({
      activeWave: { id: activeWaveId, set: setActiveWave },
    }));
  });

  it('prefetches wave data on hover when not active', async () => {
    render(<BrainLeftSidebarWave wave={baseWave} onHover={onHover} />);
    const link = screen.getByRole('link');
    await userEvent.hover(link);
    expect(onHover).toHaveBeenCalledWith('1');
    expect(prefetch).toHaveBeenCalledWith('1');
  });

  it('does not prefetch when hovering active wave', async () => {
    activeWaveId = '1';
    mockedUseMyStream.mockImplementation(() => ({
      activeWave: { id: activeWaveId, set: setActiveWave },
    }));
    render(<BrainLeftSidebarWave wave={baseWave} onHover={onHover} />);
    await userEvent.hover(screen.getByRole('link'));
    expect(onHover).not.toHaveBeenCalled();
    expect(prefetch).not.toHaveBeenCalled();
  });

  it('computes href based on current wave', () => {
    const { rerender } = render(<BrainLeftSidebarWave wave={baseWave} onHover={onHover} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/waves?wave=1');
    activeWaveId = '1';
    mockedUseMyStream.mockImplementation(() => ({
      activeWave: { id: activeWaveId, set: setActiveWave },
    }));
    rerender(<BrainLeftSidebarWave wave={baseWave} onHover={onHover} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/waves');
  });

  it('pushes shallow route on click', async () => {
    render(<BrainLeftSidebarWave wave={baseWave} onHover={onHover} />);
    const link = screen.getByRole('link');
    await userEvent.click(link);
    expect(setActiveWave).toHaveBeenCalledWith('1', { isDirectMessage: false, serialNo: null, divider: null });
  });

  it('shows drop indicators for non-chat waves', () => {
    const dropWave = { ...baseWave, id: '2', type: ApiWaveType.Approve };
    render(<BrainLeftSidebarWave wave={dropWave} onHover={onHover} />);
    expect(screen.getByTestId('drop-time')).toHaveTextContent('123');
  });

  it('includes firstUnreadDropSerialNo in href when present', () => {
    const waveWithUnread = { ...baseWave, id: '3', firstUnreadDropSerialNo: 42 };
    render(<BrainLeftSidebarWave wave={waveWithUnread} onHover={onHover} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/waves?divider=42&wave=3&serialNo=42');
  });

  it('does not include serialNo in href when firstUnreadDropSerialNo is null', () => {
    const waveWithoutUnread = { ...baseWave, id: '4', firstUnreadDropSerialNo: null };
    render(<BrainLeftSidebarWave wave={waveWithoutUnread} onHover={onHover} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/waves?wave=4');
  });

  it('shows muted indicator when wave is muted', () => {
    const mutedWave = { ...baseWave, id: '5', isMuted: true };
    render(<BrainLeftSidebarWave wave={mutedWave} onHover={onHover} />);
    const bellSlashIcons = document.querySelectorAll('[data-icon="bell-slash"]');
    expect(bellSlashIcons.length).toBeGreaterThan(0);
  });

  it('does not show muted indicator when wave is not muted', () => {
    const unmutedWave = { ...baseWave, id: '6', isMuted: false };
    render(<BrainLeftSidebarWave wave={unmutedWave} onHover={onHover} />);
    const bellSlashIcons = document.querySelectorAll('[data-icon="bell-slash"]');
    expect(bellSlashIcons.length).toBe(0);
  });
});
