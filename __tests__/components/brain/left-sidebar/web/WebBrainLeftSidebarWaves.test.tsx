import { fireEvent, render, screen } from "@testing-library/react";
import WebBrainLeftSidebarWaves from "@/components/brain/left-sidebar/web/WebBrainLeftSidebarWaves";

const fetchNextPage = jest.fn();
const registerWave = jest.fn();
const requestMainWavesList = jest.fn();
const useMyStream = jest.fn();

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => useMyStream(),
}));

jest.mock(
  "@/components/brain/left-sidebar/web/WebUnifiedWavesList",
  () =>
    function WebUnifiedWavesListMock(props: {
      readonly fetchNextPage: () => void;
      readonly isFetching: boolean;
    }) {
      return (
        <button
          type="button"
          data-testid="list"
          data-fetching={props.isFetching ? "true" : "false"}
          onClick={props.fetchNextPage}
        />
      );
    }
);

const mockStream = (isFetching: boolean) => {
  useMyStream.mockReturnValue({
    waves: {
      list: [],
      hasNextPage: true,
      isFetchingNextPage: false,
      isFetching,
      isPinnedWavesLoading: false,
      fetchNextPage,
    },
    registerWave,
    requestMainWavesList,
  });
};

describe("WebBrainLeftSidebarWaves", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStream(false);
  });

  it("requests the main Waves list once when the sidebar mounts", () => {
    const { rerender } = render(
      <WebBrainLeftSidebarWaves scrollContainerRef={{ current: null }} />
    );
    rerender(
      <WebBrainLeftSidebarWaves scrollContainerRef={{ current: null }} />
    );

    expect(requestMainWavesList).toHaveBeenCalledTimes(1);
  });

  it("loads the next page only while the list is idle", () => {
    render(<WebBrainLeftSidebarWaves scrollContainerRef={{ current: null }} />);
    fireEvent.click(screen.getByTestId("list"));
    expect(fetchNextPage).toHaveBeenCalledTimes(1);

    mockStream(true);
    render(<WebBrainLeftSidebarWaves scrollContainerRef={{ current: null }} />);
    fireEvent.click(screen.getAllByTestId("list")[1]!);
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });
});
