import { act, render, screen } from "@testing-library/react";
import React from "react";
import { QuickDmListPanel } from "@/components/messages/quick-dms/QuickDmListPanel";
import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

jest.mock("@/components/waves/WavePicture", () => ({
  __esModule: true,
  default: ({ name }: { readonly name: string }) => (
    <div data-testid="wave-picture">{name}</div>
  ),
}));

jest.mock("@heroicons/react/24/outline", () => ({
  InboxIcon: () => <span aria-hidden="true" data-testid="inbox-icon" />,
  ShieldCheckIcon: () => (
    <span aria-hidden="true" data-testid="shield-check-icon" />
  ),
  PaperAirplaneIcon: () => (
    <span aria-hidden="true" data-testid="paper-airplane-icon" />
  ),
  XMarkIcon: () => <span aria-hidden="true" data-testid="x-mark-icon" />,
}));

class MockIntersectionObserver implements IntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  readonly root: Element | Document | null = null;
  readonly rootMargin = "";
  readonly thresholds: ReadonlyArray<number> = [];

  readonly observe = jest.fn();
  readonly unobserve = jest.fn();
  readonly disconnect = jest.fn();
  readonly takeRecords = jest.fn((): IntersectionObserverEntry[] => []);

  constructor(private readonly callback: IntersectionObserverCallback) {
    MockIntersectionObserver.instances.push(this);
  }

  trigger(isIntersecting: boolean): void {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as IntersectionObserver
    );
  }
}

const createWave = (index: number): MinimalWave => ({
  id: `wave-${index}`,
  name: `DM ${index}`,
  type: ApiWaveType.Chat,
  createdAt: 0,
  newDropsCount: {
    count: 0,
    latestDropTimestamp: null,
    firstUnreadSerialNo: null,
  },
  picture: null,
  contributors: [],
  isPinned: false,
  isFollowing: true,
  isOfficial: false,
  isMuted: false,
  parentWaveId: null,
  hasSubwaves: false,
  followedSubwavesCount: 0,
  latestFollowedSubwaveDropTimestamp: null,
  unreadSubwaveDrops: 0,
  apiUnreadDropsCount: 0,
  unreadDropsCount: 0,
  latestReadTimestamp: 0,
  firstUnreadDropSerialNo: null,
  firstUnreadFollowedSubwaveDropSerialNo: null,
  waveRep: null,
  waveScore: null,
  sidebarSection: null,
  sidebarActivityTimestamp: null,
  isFollowedSubwaveContainer: false,
});

const renderPanel = ({
  fetchNextPage = jest.fn(),
  hasNextPage = false,
  isFetchingNextPage = false,
  waves = Array.from({ length: 6 }, (_, index) => createWave(index + 1)),
}: {
  readonly fetchNextPage?: jest.Mock;
  readonly hasNextPage?: boolean;
  readonly isFetchingNextPage?: boolean;
  readonly waves?: MinimalWave[];
} = {}) => {
  render(
    <QuickDmListPanel
      isFetching={false}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      locale="en-US"
      onClose={jest.fn()}
      onFetchNextPage={fetchNextPage}
      onOpenChat={jest.fn()}
      onRegisterWave={jest.fn()}
      waves={waves}
    />
  );

  return { fetchNextPage };
};

describe("QuickDmListPanel", () => {
  beforeEach(() => {
    MockIntersectionObserver.instances = [];
    Object.defineProperty(globalThis, "IntersectionObserver", {
      configurable: true,
      value: MockIntersectionObserver,
    });
    Object.defineProperty(globalThis.window, "IntersectionObserver", {
      configurable: true,
      value: MockIntersectionObserver,
    });
  });

  it("shows more than four conversations without the show all footer", () => {
    renderPanel();

    expect(
      screen.getAllByRole("button", { name: /Open conversation with DM/i })
    ).toHaveLength(6);
    expect(
      screen.queryByRole("link", { name: /show all/i })
    ).not.toBeInTheDocument();
  });

  it("loads the next page when the bottom sentinel intersects", () => {
    const { fetchNextPage } = renderPanel({ hasNextPage: true });

    expect(MockIntersectionObserver.instances).toHaveLength(1);

    act(() => {
      MockIntersectionObserver.instances[0]?.trigger(true);
    });

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("does not observe or load when there is no next page", () => {
    const { fetchNextPage } = renderPanel({ hasNextPage: false });

    expect(MockIntersectionObserver.instances).toHaveLength(0);
    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it("does not observe or load while the next page is already fetching", () => {
    const { fetchNextPage } = renderPanel({
      hasNextPage: true,
      isFetchingNextPage: true,
    });

    expect(MockIntersectionObserver.instances).toHaveLength(0);
    expect(fetchNextPage).not.toHaveBeenCalled();
  });
});
