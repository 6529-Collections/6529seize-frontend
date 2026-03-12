import { fireEvent, render, screen } from "@testing-library/react";
import UserPageBrainSidebar from "@/components/user/brain/UserPageBrainSidebar";
import { useWaves } from "@/hooks/useWaves";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt, fill, unoptimized, ...props }: any) => (
    <img alt={alt ?? ""} {...props} />
  ),
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, prefetch, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
jest.mock("@/hooks/useWaves", () => ({
  useWaves: jest.fn(),
}));

const mockedUseWaves = useWaves as jest.MockedFunction<typeof useWaves>;

const baseProfile = {
  handle: "kanetix",
  display: "Kanetix",
  primary_wallet: "0xabc",
} as any;

const makeWave = (overrides: Record<string, unknown> = {}) =>
  ({
    id: "wave-1",
    name: "TDH Name Vote",
    picture: null,
    pinned: false,
    author: {
      handle: null,
      banner1_color: null,
      banner2_color: null,
    },
    visibility: {
      scope: {
        group: null,
      },
    },
    chat: { scope: { group: { is_direct_message: false } } },
    metrics: {
      drops_count: 12,
      subscribers_count: 25,
      latest_drop_timestamp: Date.now(),
    },
    ...overrides,
  }) as any;

describe("UserPageBrainSidebar", () => {
  beforeEach(() => {
    mockedUseWaves.mockReset();
    mockedUseWaves.mockReturnValue({
      waves: [],
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      status: "success",
      error: null,
      refetch: jest.fn(),
    });
  });

  it("renders created waves and the empty most-active placeholder", () => {
    mockedUseWaves.mockReturnValue({
      waves: [makeWave()],
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      status: "success",
      error: null,
      refetch: jest.fn(),
    });

    render(<UserPageBrainSidebar profile={baseProfile} />);

    expect(screen.getByText("Created Waves")).toBeInTheDocument();
    expect(screen.getByText("TDH Name Vote")).toBeInTheDocument();
    expect(screen.getByText("Most Active In")).toBeInTheDocument();
    expect(mockedUseWaves).toHaveBeenCalledTimes(1);
    expect(mockedUseWaves).toHaveBeenCalledWith({
      identity: "kanetix",
      waveName: null,
      enabled: true,
      directMessage: false,
      limit: 20,
    });
  });

  it("uses the primary wallet when the profile has no handle", () => {
    render(
      <UserPageBrainSidebar
        profile={{ ...baseProfile, handle: null, primary_wallet: "0xdef" }}
      />
    );

    expect(mockedUseWaves).toHaveBeenCalledWith({
      identity: "0xdef",
      waveName: null,
      enabled: true,
      directMessage: false,
      limit: 20,
    });
  });

  it("hides the created section when there are no created waves", () => {
    render(<UserPageBrainSidebar profile={baseProfile} />);

    expect(screen.queryByText("Created Waves")).toBeNull();
    expect(mockedUseWaves).toHaveBeenCalledTimes(1);
  });

  it("expands and collapses the created waves list", () => {
    mockedUseWaves.mockReturnValue({
      waves: [
        makeWave(),
        makeWave({
          id: "wave-2",
          name: "Meme Card Curation",
          metrics: {
            drops_count: 8,
            subscribers_count: 10,
            latest_drop_timestamp: Date.now(),
          },
        }),
      ],
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      status: "success",
      error: null,
      refetch: jest.fn(),
    });

    render(<UserPageBrainSidebar profile={baseProfile} />);

    expect(screen.getByText("Show 1 more")).toBeInTheDocument();
    expect(screen.queryByText("Meme Card Curation")).toBeNull();

    fireEvent.click(screen.getByText("Show 1 more"));
    expect(screen.getByText("Meme Card Curation")).toBeInTheDocument();
    expect(screen.getByText("Show less")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Show less"));
    expect(screen.queryByText("Meme Card Curation")).toBeNull();
  });
});
