import { render, screen } from "@testing-library/react";
import React from "react";
import WebUnifiedWavesList from "@/components/brain/left-sidebar/web/WebUnifiedWavesList";
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

jest.mock(
  "@/components/brain/left-sidebar/web/WebUnifiedWavesListWaves",
  () => ({
    __esModule: true,
    default: React.forwardRef((props: any, ref: any) => {
      const sentinelRef = React.useRef<HTMLDivElement>(null);
      React.useImperativeHandle(ref, () => ({ sentinelRef }));
      receivedCollapsed = props.isCollapsed;
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
