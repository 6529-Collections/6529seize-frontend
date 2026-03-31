import { render, screen } from "@testing-library/react";
import React from "react";
import WebUnifiedWavesList from "@/components/brain/left-sidebar/web/WebUnifiedWavesList";

jest.mock("@/hooks/useInfiniteScroll", () => ({
  useInfiniteScroll: jest.fn(),
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
    default: () => <div data-testid="empty" />,
  })
);

describe("WebUnifiedWavesList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    receivedCollapsed = false;
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
});
