import { act, render, screen } from '@testing-library/react';
import React from 'react';
import UnifiedWavesList from '../../../../../components/brain/left-sidebar/waves/UnifiedWavesList';
import useDeviceInfo from '../../../../../hooks/useDeviceInfo';
import { createMockMinimalWave } from '../../../../utils/mockFactories';

jest.mock('../../../../../hooks/useDeviceInfo');
jest.mock('../../../../../components/brain/left-sidebar/waves/UnifiedWavesListLoader', () => ({
  UnifiedWavesListLoader: ({ isFetchingNextPage }: any) => <div data-testid="loader">{String(isFetchingNextPage)}</div>
}));
jest.mock('../../../../../components/brain/left-sidebar/waves/UnifiedWavesListEmpty', () => ({
  __esModule: true,
  default: ({ sortedWaves }: any) => <div data-testid="empty">{sortedWaves.length}</div>
}));

let sentinel: HTMLElement | null = null;

jest.mock('../../../../../components/brain/left-sidebar/waves/UnifiedWavesListWaves', () => {
  return {
    __esModule: true,
    default: React.forwardRef((props: any, ref: any) => {
      const sentinelRef = React.useRef<HTMLDivElement>(null);
      const containerRef = React.useRef<HTMLDivElement>(null);
      React.useImperativeHandle(ref, () => ({ sentinelRef, containerRef }));
      React.useEffect(() => { sentinel = sentinelRef.current; }, []);
      return <div data-testid="waves"><div ref={sentinelRef} /></div>;
    })
  };
});

type DeviceInfo = { isApp: boolean; isMobileDevice: boolean; hasTouchScreen: boolean };
const useDeviceInfoMock = useDeviceInfo as jest.MockedFunction<typeof useDeviceInfo>;

beforeEach(() => {
  sentinel = null;
  useDeviceInfoMock.mockReturnValue({ isApp: false, isMobileDevice: false, hasTouchScreen: false } as DeviceInfo);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('UnifiedWavesList', () => {
  it('shows create link when not in app', () => {
    render(
      <UnifiedWavesList
        waves={[]}
        activeWaveId={null}
        fetchNextPage={jest.fn()}
        hasNextPage={false}
        isFetching={false}
        isFetchingNextPage={false}
        onHover={jest.fn()}
        scrollContainerRef={React.createRef()}
      />
    );
    expect(screen.getByText('Create Wave')).toBeInTheDocument();
    expect(screen.getByTestId('loader')).toHaveTextContent('false');
  });

  it('triggers fetchNextPage when sentinel intersects', () => {
    useDeviceInfoMock.mockReturnValue({ isApp: true, isMobileDevice: false, hasTouchScreen: false } as DeviceInfo);
    const fetchNextPage = jest.fn();
    const observerInstances: any[] = [];
    (global as any).IntersectionObserver = class {
      callback: any;
      constructor(cb: any) { this.callback = cb; observerInstances.push(this); }
      observe() {}
      disconnect() {}
    };

    render(
      <UnifiedWavesList
        waves={[createMockMinimalWave({ id: '1', isPinned: false })]}
        activeWaveId={null}
        fetchNextPage={fetchNextPage}
        hasNextPage={true}
        isFetching={false}
        isFetchingNextPage={false}
        onHover={jest.fn()}
        scrollContainerRef={React.createRef()}
      />
    );

    act(() => {
      observerInstances[0].callback([{ isIntersecting: true }]);
    });
    expect(fetchNextPage).toHaveBeenCalled();
  });
});
