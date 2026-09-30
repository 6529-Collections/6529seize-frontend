import { render, screen } from "@testing-library/react";
import React from "react";
import WebUnifiedWavesList from "@/components/brain/left-sidebar/web/WebUnifiedWavesList";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useShowFollowingWaves } from "@/hooks/useShowFollowingWaves";

jest.mock("@/hooks/useInfiniteScroll", () => ({
  useInfiniteScroll: jest.fn(),
}));
jest.mock("@/hooks/useShowFollowingWaves");
jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(() => ({
    connectedProfile: { handle: "alice" },
    activeProfileProxy: null,
  })),
}));

let receivedCollapsed = false;
let receivedLoading = false;

jest.mock(
  "@/components/brain/left-sidebar/web/WebUnifiedWavesListWaves",
  () => ({
    __esModule: true,
    default: React.forwardRef((props: any, ref: any) => {
      const sentinelRef = React.useRef<HTMLDivElement>(null);
      React.useImperativeHandle(ref, () => ({ sentinelRef }));
      receivedCollapsed = props.isCollapsed;
      receivedLoading = props.isLoading;
      return <div data-testid="waves" />;
    }),
  })
);

jest.mock(
  "@/components/brain/left-sidebar/waves/UnifiedWavesListLoader",
  () => ({
    UnifiedWavesListLoader: () => <div data-testid="loader" />,
  })
);

jest.mock(
  "@/components/brain/left-sidebar/waves/UnifiedWavesListEmpty",
  () => ({
    __esModule: true,
    default: ({ emptyMessage }: any) => (
      <div data-testid="empty">{emptyMessage ?? ""}</div>
    ),
  })
);

const mockUseShowFollowingWaves = useShowFollowingWaves as jest.Mock;

describe("WebUnifiedWavesList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    receivedCollapsed = false;
    mockUseShowFollowingWaves.mockReturnValue([false, jest.fn()]);
  });

  it("renders the list content without owning the footer", () => {
    render(
      <WebUnifiedWavesList
        waves={[]}
        fetchNextPage={jest.fn()}
        hasNextPage={false}
        isFetching={false}
        isFetchingNextPage={false}
        onHover={jest.fn()}
        scrollContainerRef={React.createRef()}
      />
    );

    expect(screen.getByTestId("waves")).toBeInTheDocument();
    expect(screen.getByTestId("loader")).toBeInTheDocument();
    expect(screen.getByTestId("empty")).toBeInTheDocument();
    expect(screen.queryByText("Uncast Power")).not.toBeInTheDocument();
  });

  it("passes collapsed mode through to the waves renderer", () => {
    render(
      <WebUnifiedWavesList
        waves={[]}
        fetchNextPage={jest.fn()}
        hasNextPage={false}
        isFetching={false}
        isFetchingNextPage={false}
        onHover={jest.fn()}
        scrollContainerRef={React.createRef()}
        isCollapsed
      />
    );

    expect(receivedCollapsed).toBe(true);
  });

  it("shows joined empty copy when the joined filter is active", () => {
    mockUseShowFollowingWaves.mockReturnValue([true, jest.fn()]);

    render(
      <WebUnifiedWavesList
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
});

jest.mock("@/hooks/useWaveDiscoveryViewer", () => ({
  useWaveDiscoveryViewer: () => ({
    key: null,
    enabled: true,
    canUseCollections: Boolean(
      require("@/components/auth/Auth").useAuth().connectedProfile?.handle
    ),
  }),
}));

it.each([true, false])(
  "enables pagination only in the collapsed rail for a saved Pinned collection (collapsed=%s)",
  (isCollapsed) => {
    localStorage.setItem("wave-sidebar-collection", "pinned");
    render(
      <WebUnifiedWavesList
        waves={[]}
        fetchNextPage={jest.fn()}
        hasNextPage
        isFetching={false}
        isFetchingNextPage={false}
        onHover={jest.fn()}
        scrollContainerRef={React.createRef()}
        isCollapsed={isCollapsed}
      />
    );
    expect(jest.mocked(useInfiniteScroll).mock.calls.at(-1)?.[0]).toBe(
      isCollapsed
    );
  }
);

it("keeps the selected Pinned collection loading until its separate request finishes", () => {
  localStorage.setItem("wave-sidebar-collection", "pinned");
  const props = {
    waves: [],
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isFetching: false,
    isFetchingNextPage: false,
    onHover: jest.fn(),
    scrollContainerRef: React.createRef<HTMLDivElement>(),
  };
  const { rerender } = render(
    <WebUnifiedWavesList {...props} isPinnedWavesLoading />
  );
  expect(receivedLoading).toBe(true);
  rerender(<WebUnifiedWavesList {...props} isPinnedWavesLoading={false} />);
  expect(receivedLoading).toBe(false);
});
