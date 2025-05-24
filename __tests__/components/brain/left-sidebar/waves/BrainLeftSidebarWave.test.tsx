import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BrainLeftSidebarWave from '../../../../../components/brain/left-sidebar/waves/BrainLeftSidebarWave';
import { ApiWaveType } from '../../../../../generated/models/ApiWaveType';
import { useRouter } from 'next/router';
import { usePrefetchWaveData } from '../../../../../hooks/usePrefetchWaveData';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, onMouseEnter, onClick, className }: any) => (
    <a href={href} onMouseEnter={onMouseEnter} onClick={onClick} className={className}>{children}</a>
  ),
}));
jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('../../../../../hooks/usePrefetchWaveData');
jest.mock('../../../../../components/waves/WavePicture', () => (props: any) => <img data-testid="wave-picture" alt={props.name} />);
jest.mock('../../../../../components/brain/left-sidebar/waves/BrainLeftSidebarWaveDropTime', () => (props: any) => <span data-testid="drop-time">{props.time}</span>);
jest.mock('../../../../../components/brain/left-sidebar/waves/BrainLeftSidebarWavePin', () => (props: any) => <div data-testid="pin">{String(props.isPinned)}</div>);

const mockedUseRouter = useRouter as jest.Mock;
const mockedPrefetch = usePrefetchWaveData as jest.Mock;

describe('BrainLeftSidebarWave', () => {
  const prefetch = jest.fn();
  const onHover = jest.fn();
  const router = { query: {}, push: jest.fn() } as any;

  const baseWave = {
    id: '1',
    type: ApiWaveType.Chat,
    name: 'Chat Wave',
    picture: '',
    contributors: [],
    newDropsCount: { count: 2, latestDropTimestamp: 123 },
    isPinned: false,
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseRouter.mockReturnValue(router);
    mockedPrefetch.mockReturnValue(prefetch);
    router.query = {};
  });

  it('prefetches wave data on hover when not active', async () => {
    render(<BrainLeftSidebarWave wave={baseWave} onHover={onHover} />);
    const link = screen.getByRole('link');
    await userEvent.hover(link);
    expect(onHover).toHaveBeenCalledWith('1');
    expect(prefetch).toHaveBeenCalledWith('1');
  });

  it('does not prefetch when hovering active wave', async () => {
    router.query = { wave: '1' };
    render(<BrainLeftSidebarWave wave={baseWave} onHover={onHover} />);
    await userEvent.hover(screen.getByRole('link'));
    expect(onHover).not.toHaveBeenCalled();
    expect(prefetch).not.toHaveBeenCalled();
  });

  it('computes href based on current wave', () => {
    const { rerender } = render(<BrainLeftSidebarWave wave={baseWave} onHover={onHover} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/my-stream?wave=1');
    router.query = { wave: '1' };
    rerender(<BrainLeftSidebarWave wave={baseWave} onHover={onHover} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/my-stream');
  });

  it('pushes shallow route on click', async () => {
    render(<BrainLeftSidebarWave wave={baseWave} onHover={onHover} />);
    const link = screen.getByRole('link');
    await userEvent.click(link);
    expect(router.push).toHaveBeenCalledWith('/my-stream?wave=1', undefined, { shallow: true });
  });

  it('shows drop indicators for non-chat waves', () => {
    const dropWave = { ...baseWave, id: '2', type: ApiWaveType.Approve };
    render(<BrainLeftSidebarWave wave={dropWave} onHover={onHover} />);
    expect(screen.getByTestId('drop-time')).toHaveTextContent('123');
  });
});
