import { render, screen } from '@testing-library/react';
import BrainContentInput from '@/components/brain/content/input/BrainContentInput';

const useWaveDataMock = jest.fn();
const useCapacitorMock = jest.fn();

jest.mock('@/hooks/useWaveData', () => ({
  useWaveData: (args: any) => useWaveDataMock(args),
}));

jest.mock('@/hooks/useCapacitor', () => ({
  __esModule: true,
  default: () => useCapacitorMock(),
}));

jest.mock('@/components/waves/PrivilegedDropCreator', () => ({
  __esModule: true,
  default: ({ wave }: any) => <div data-testid="creator">{wave.id}</div>,
  DropMode: { BOTH: 'BOTH' },
}));

describe('BrainContentInput', () => {
  beforeEach(() => {
    useWaveDataMock.mockReset();
    useCapacitorMock.mockReset();
  });

  it('returns null when wave is missing', () => {
    useCapacitorMock.mockReturnValue({ isCapacitor: false });
    useWaveDataMock.mockReturnValue({ data: null });
    const { container } = render(
      <BrainContentInput activeDrop={null} onCancelReplyQuote={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders creator and passes wave id', () => {
    useCapacitorMock.mockReturnValue({ isCapacitor: false });
    useWaveDataMock.mockReturnValue({ data: { id: 'w1' } });
    render(
      <BrainContentInput
        activeDrop={{ drop: { wave: { id: 'w1' } } } as any}
        onCancelReplyQuote={jest.fn()}
      />
    );
    expect(useWaveDataMock).toHaveBeenCalledWith({
      waveId: 'w1',
      onWaveNotFound: expect.any(Function),
    });
    expect(screen.getByTestId('creator')).toHaveTextContent('w1');
    expect(screen.getByTestId('creator').parentElement?.className).toContain(
      'tw-max-h-[calc(100vh-20rem)]'
    );
  });

  it('uses capacitor height and triggers onWaveNotFound', () => {
    const onCancel = jest.fn();
    let onWaveNotFound: (() => void) | null = null;
    useCapacitorMock.mockReturnValue({ isCapacitor: true });
    useWaveDataMock.mockImplementation((args: any) => {
      onWaveNotFound = args.onWaveNotFound;
      return { data: { id: 'w2' } };
    });
    render(
      <BrainContentInput
        activeDrop={{ drop: { wave: { id: 'w2' } } } as any}
        onCancelReplyQuote={onCancel}
      />
    );
    expect(screen.getByTestId('creator').parentElement?.className).toContain(
      'tw-max-h-[calc(100vh-14.7rem)]'
    );
    if (onWaveNotFound) {
      (onWaveNotFound as any)();
    }
    expect(onCancel).toHaveBeenCalled();
  });
});
