import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import UnifiedWavesList from "@/components/brain/left-sidebar/waves/UnifiedWavesList";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useShowFollowingWaves } from "@/hooks/useShowFollowingWaves";
import { createMockMinimalWave } from "@/__tests__/utils/mockFactories";

jest.mock("@/hooks/useDeviceInfo");
jest.mock("@/hooks/useShowFollowingWaves");
jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(() => ({
    connectedProfile: { handle: "alice" },
    activeProfileProxy: null,
  })),
}));
const mockOpenWave = jest.fn();
jest.mock("@/hooks/useCreateModalState", () => ({
  __esModule: true,
  default: jest.fn(() => ({ openWave: mockOpenWave })),
}));
jest.mock(
  "@/components/brain/left-sidebar/waves/UnifiedWavesListLoader",
  () => ({
    UnifiedWavesListLoader: ({ isFetchingNextPage }: any) => (
      <div data-testid="loader">{String(isFetchingNextPage)}</div>
    ),
  })
);
jest.mock(
  "@/components/brain/left-sidebar/waves/UnifiedWavesListEmpty",
  () => ({
    __esModule: true,
    default: ({ emptyMessage, sortedWaves }: any) => (
      <div data-testid="empty">{emptyMessage ?? sortedWaves.length}</div>
    ),
  })
);

let sentinel: HTMLElement | null = null;

jest.mock("@/components/brain/left-sidebar/waves/UnifiedWavesListWaves", () => {
  return {
    __esModule: true,
    default: React.forwardRef((_: any, ref: any) => {
      const sentinelRef = React.useRef<HTMLDivElement>(null);
      const containerRef = React.useRef<HTMLDivElement>(null);
      React.useImperativeHandle(ref, () => ({ sentinelRef, containerRef }));
      React.useEffect(() => {
        sentinel = sentinelRef.current;
      }, []);
      return (
        <div data-testid="waves">
          <div ref={sentinelRef} />
        </div>
      );
    }),
  };
});

type DeviceInfo = {
  isApp: boolean;
  isMobileDevice: boolean;
  hasTouchScreen: boolean;
  isAppleMobile: boolean;
};
const useDeviceInfoMock = useDeviceInfo as jest.MockedFunction<
  typeof useDeviceInfo
>;
const mockUseShowFollowingWaves = useShowFollowingWaves as jest.Mock;

beforeEach(() => {
  sentinel = null;
  mockOpenWave.mockClear();
  mockUseShowFollowingWaves.mockReturnValue([false, jest.fn()]);
  useDeviceInfoMock.mockReturnValue({
    isApp: false,
    isMobileDevice: false,
    hasTouchScreen: false,
    isAppleMobile: false,
  } as DeviceInfo);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("UnifiedWavesList", () => {
  it("opens create wave locally when not in app", async () => {
    render(
      <UnifiedWavesList
        waves={[]}
        fetchNextPage={jest.fn()}
        hasNextPage={false}
        isFetching={false}
        isFetchingNextPage={false}
        onHover={jest.fn()}
        scrollContainerRef={React.createRef()}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: "Create Wave" }));
    expect(mockOpenWave).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("loader")).toHaveTextContent("false");
  });

  it("shows joined empty copy when the joined filter is active", () => {
    mockUseShowFollowingWaves.mockReturnValue([true, jest.fn()]);

    render(
      <UnifiedWavesList
        waves={[]}
        fetchNextPage={jest.fn()}
        hasNextPage={false}
        isFetching={false}
        isFetchingNextPage={false}
        onHover={jest.fn()}
        scrollContainerRef={React.createRef()}
      />
    );

    expect(screen.getByTestId("empty")).toHaveTextContent(
      "No joined waves to display"
    );
  });

  it("triggers fetchNextPage when sentinel intersects", () => {
    useDeviceInfoMock.mockReturnValue({
      isApp: true,
      isMobileDevice: false,
      hasTouchScreen: false,
      isAppleMobile: false,
    } as DeviceInfo);
    const fetchNextPage = jest.fn();
    const observerInstances: any[] = [];
    (global as any).IntersectionObserver = class {
      callback: any;
      constructor(cb: any) {
        this.callback = cb;
        observerInstances.push(this);
      }
      observe() {}
      disconnect() {}
    };

    render(
      <UnifiedWavesList
        waves={[createMockMinimalWave({ id: "1", isPinned: false })]}
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
