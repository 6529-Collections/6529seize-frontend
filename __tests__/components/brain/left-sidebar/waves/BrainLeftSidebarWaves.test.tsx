import { render, fireEvent } from "@testing-library/react";
import BrainLeftSidebarWaves from "@/components/brain/left-sidebar/waves/BrainLeftSidebarWaves";

let fetchNextPage = jest.fn();
let registerWave = jest.fn();
let requestMainWavesList = jest.fn();
const useMyStream = jest.fn();

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: (...args: any) => useMyStream(...args),
}));

jest.mock(
  "@/components/brain/left-sidebar/waves/UnifiedWavesList",
  () => (props: any) => <div data-testid="list" onClick={props.fetchNextPage} />
);

describe("BrainLeftSidebarWaves", () => {
  beforeEach(() => {
    fetchNextPage.mockClear();
    requestMainWavesList.mockClear();
    useMyStream.mockReturnValue({
      waves: {
        list: [],
        hasNextPage: true,
        isFetchingNextPage: false,
        isFetching: false,
        fetchNextPage,
      },
      activeWave: { id: "1" },
      registerWave,
      requestMainWavesList,
    });
  });

  it("calls fetchNextPage when list requests next page", () => {
    const { getByTestId } = render(
      <BrainLeftSidebarWaves scrollContainerRef={{ current: null }} />
    );
    expect(requestMainWavesList).toHaveBeenCalledTimes(1);
    fireEvent.click(getByTestId("list"));
    expect(fetchNextPage).toHaveBeenCalled();
  });

  it("does not fetch when already loading", () => {
    useMyStream.mockReturnValue({
      waves: {
        list: [],
        hasNextPage: true,
        isFetchingNextPage: true,
        isFetching: false,
        fetchNextPage,
      },
      activeWave: { id: "1" },
      registerWave,
      requestMainWavesList,
    });
    const { getByTestId } = render(
      <BrainLeftSidebarWaves scrollContainerRef={{ current: null }} />
    );
    fireEvent.click(getByTestId("list"));
    expect(fetchNextPage).not.toHaveBeenCalled();
  });
});
