import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SingleWaveDropVoters } from "@/components/waves/drop/SingleWaveDropVoters";
import { useWaveTopVoters } from "@/hooks/useWaveTopVoters";
import { useAuth } from "@/components/auth/Auth";

let intersectionCb: any;
const downloadMock = jest.fn();
const setToastMock = jest.fn();
const downloaderMock = jest.fn();

jest.mock("@/hooks/useWaveTopVoters");
jest.mock("@/components/auth/Auth", () => ({ useAuth: jest.fn() }));
jest.mock("@/services/auth/auth.utils", () => ({
  getAuthJwt: jest.fn(() => "jwt"),
  getStagingAuth: jest.fn(() => "staging"),
}));
jest.mock("react-use-downloader", () => ({
  __esModule: true,
  default: (...args: any[]) => downloaderMock(...args),
}));
jest.mock("@/hooks/useIntersectionObserver", () => ({
  useIntersectionObserver: (cb: any) => {
    intersectionCb = cb;
    return { current: null };
  },
}));
jest.mock("@/components/waves/drop/SingleWaveDropVoter", () => ({
  SingleWaveDropVoter: (props: any) => (
    <div data-testid="voter">{props.voter.voter.id}</div>
  ),
}));

const useVoters = useWaveTopVoters as jest.Mock;
const useAuthMock = useAuth as jest.Mock;

const baseDrop = {
  id: "d",
  wave: { id: "w", voting_credit_type: "REP" },
} as any;

describe("SingleWaveDropVoters", () => {
  beforeEach(() => {
    useVoters.mockReset();
    downloadMock.mockReset();
    setToastMock.mockReset();
    downloaderMock.mockReset();
    downloaderMock.mockReturnValue({
      download: downloadMock,
      error: null,
      isInProgress: false,
    });
    useAuthMock.mockReturnValue({
      connectedProfile: null,
      setToast: setToastMock,
    });
  });

  it("shows placeholder when no voters", async () => {
    const user = userEvent.setup();
    useVoters.mockReturnValue({
      voters: [],
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isLoading: false,
    });
    render(<SingleWaveDropVoters drop={baseDrop} />);
    expect(useVoters).toHaveBeenLastCalledWith(
      expect.objectContaining({ enabled: false })
    );
    await user.click(screen.getByRole("button", { name: "Top voters" }));
    expect(useVoters).toHaveBeenLastCalledWith(
      expect.objectContaining({ enabled: true })
    );
    expect(screen.getByText("Be the First to Make a Vote")).toBeInTheDocument();
  });

  it("fetches next page on intersection", async () => {
    const user = userEvent.setup();
    const fetchNextPage = jest.fn();
    useVoters.mockReturnValue({
      voters: [{ voter: { id: "v1" } }],
      isFetchingNextPage: false,
      fetchNextPage,
      hasNextPage: true,
      isLoading: false,
    });
    render(<SingleWaveDropVoters drop={baseDrop} />);
    await user.click(screen.getByRole("button", { name: "Top voters" }));
    expect(screen.getByTestId("voter")).toHaveTextContent("v1");
    intersectionCb();
    expect(fetchNextPage).toHaveBeenCalled();
  });

  it("downloads all votes as csv for the drop", async () => {
    const user = userEvent.setup();
    useVoters.mockReturnValue({
      voters: [],
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isLoading: false,
    });

    render(<SingleWaveDropVoters drop={baseDrop} />);
    await user.click(
      screen.getByRole("button", { name: "Download all top voters as CSV" })
    );

    expect(downloadMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v2/drops/d/votes/download"),
      "drop-votes-d.csv",
      undefined,
      {
        headers: {
          Accept: "text/csv",
          Authorization: "Bearer jwt",
          "x-6529-auth": "staging",
        },
      }
    );
    expect(useVoters).toHaveBeenLastCalledWith(
      expect.objectContaining({ enabled: false })
    );
  });

  it("sanitizes the drop id in the csv filename", async () => {
    const user = userEvent.setup();
    useVoters.mockReturnValue({
      voters: [],
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isLoading: false,
    });

    render(
      <SingleWaveDropVoters
        drop={{
          ...baseDrop,
          id: String.raw`drop/with\bad:chars*?"<>|`,
        }}
      />
    );
    await user.click(
      screen.getByRole("button", { name: "Download all top voters as CSV" })
    );

    expect(downloadMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "/api/v2/drops/drop%2Fwith%5Cbad%3Achars*%3F%22%3C%3E%7C/votes/download"
      ),
      "drop-votes-drop_with_bad_chars______.csv",
      undefined,
      expect.any(Object)
    );
  });

  it("shows downloading state while the csv download is in progress", () => {
    downloaderMock.mockReturnValue({
      download: downloadMock,
      error: null,
      isInProgress: true,
    });
    useVoters.mockReturnValue({
      voters: [],
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isLoading: false,
    });

    render(<SingleWaveDropVoters drop={baseDrop} />);

    const downloadButton = screen.getByRole("button", {
      name: "Download all top voters as CSV",
    });
    expect(downloadButton).toBeDisabled();
    expect(downloadButton).toHaveTextContent("Downloading");
  });

  it("shows a toast when csv download fails", () => {
    downloaderMock.mockReturnValue({
      download: downloadMock,
      error: { errorMessage: "backend unavailable" },
      isInProgress: false,
    });
    useVoters.mockReturnValue({
      voters: [],
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isLoading: false,
    });

    render(<SingleWaveDropVoters drop={baseDrop} />);

    expect(setToastMock).toHaveBeenCalledWith({
      type: "error",
      title: "Couldn't download voters.",
      description: "Please try again.",
      details: "backend unavailable",
    });
  });
});
