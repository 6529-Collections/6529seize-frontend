import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiWaveType } from '@/generated/models/ApiWaveType';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, onClick, className }: any) => (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  ),
}));

const push = jest.fn();
const searchParams = new URLSearchParams('wave=2');

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => searchParams,
}));

const prefetch = jest.fn();
jest.mock('@/hooks/usePrefetchWaveData', () => ({
  usePrefetchWaveData: () => prefetch,
}));

const registerWave = jest.fn();
jest.mock('@/contexts/wave/MyStreamContext', () => ({
  useMyStream: () => ({ registerWave }),
}));

jest.mock('@/hooks/isMobileDevice', () => jest.fn(() => false));

const waveData: any = {
  id: '1',
  name: 'Wave 1',
  picture: 'pic.png',
  contributors_overview: [{ contributor_pfp: 'pfp1.png' }],
  wave: { type: ApiWaveType.Rank },
};

let useWaveDataMock: any;

jest.mock('@/hooks/useWaveData', () => ({
  useWaveData: (...args: any[]) => useWaveDataMock(...args),
}));

jest.mock('@/components/waves/WavePicture', () => ({
  __esModule: true,
  default: ({ name }: any) => <div data-testid="picture">{name}</div>,
}));

import BrainContentPinnedWave from '@/components/brain/content/BrainContentPinnedWave';
import useIsMobileDevice from '@/hooks/isMobileDevice';

describe('BrainContentPinnedWave', () => {
  const onMouseEnter = jest.fn();
  const onMouseLeave = jest.fn();
  const onRemove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    searchParams.set('wave', '2');
    (useIsMobileDevice as jest.Mock).mockReturnValue(false);
    useWaveDataMock = jest.fn(() => ({ data: waveData }));
  });

  function renderComponent(active = false, id = '1') {
    return render(
      <BrainContentPinnedWave
        waveId={id}
        active={active}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onRemove={onRemove}
      />
    );
  }

  it('renders wave info and handles interactions', async () => {
    const user = userEvent.setup();
    const { container } = renderComponent();

    expect(screen.getAllByText('Wave 1').length).toBeGreaterThan(0);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/my-stream?wave=1');

    await user.hover(container.firstChild as HTMLElement);
    expect(onMouseEnter).toHaveBeenCalledWith('1');
    expect(registerWave).toHaveBeenCalledWith('1');
    expect(prefetch).toHaveBeenCalledWith('1');

    await user.click(screen.getByRole('button', { name: /Remove wave/i }));
    expect(onRemove).toHaveBeenCalledWith('1');

    await user.click(screen.getByRole('link'));
    expect(onMouseLeave).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/my-stream?wave=1');
  });

  it('uses /my-stream when viewing active wave and skips prefetch', async () => {
    searchParams.set('wave', '1');
    const user = userEvent.setup();
    const { container } = renderComponent();

    expect(screen.getByRole('link')).toHaveAttribute('href', '/my-stream');

    await user.hover(container.firstChild as HTMLElement);
    expect(onMouseEnter).toHaveBeenCalledWith('1');
    expect(registerWave).not.toHaveBeenCalled();
    expect(prefetch).not.toHaveBeenCalled();
  });

  it('calls onRemove when wave not found', () => {
    useWaveDataMock = jest.fn(({ onWaveNotFound }) => {
      onWaveNotFound();
      return { data: undefined };
    });
    renderComponent();
    expect(onRemove).toHaveBeenCalledWith('1');
  });
});
