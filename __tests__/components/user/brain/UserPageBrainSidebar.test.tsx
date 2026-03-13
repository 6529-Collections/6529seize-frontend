import { fireEvent, render, screen, within } from "@testing-library/react";
import UserPageBrainSidebar from "@/components/user/brain/UserPageBrainSidebar";
import { useFavouriteWavesOfIdentity } from "@/hooks/useFavouriteWavesOfIdentity";
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
jest.mock("@/hooks/useFavouriteWavesOfIdentity", () => ({
  useFavouriteWavesOfIdentity: jest.fn(),
}));
jest.mock("@/components/waves/drops/WaveCreatorPreviewModal", () => ({
  WaveCreatorPreviewModal: ({ isOpen, user }: any) =>
    isOpen ? (
      <div
        data-testid="wave-creator-preview-modal"
        data-user-primary-address={user.primary_address}
      />
    ) : null,
}));

const mockedUseWaves = useWaves as jest.MockedFunction<typeof useWaves>;
const mockedUseFavouriteWavesOfIdentity =
  useFavouriteWavesOfIdentity as jest.MockedFunction<
    typeof useFavouriteWavesOfIdentity
  >;

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
    contributors_overview: [],
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
    mockedUseFavouriteWavesOfIdentity.mockReset();
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
    mockedUseFavouriteWavesOfIdentity.mockReturnValue({
      waves: [],
      status: "success",
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    });
  });

  it("renders created waves and most active waves", () => {
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
    mockedUseFavouriteWavesOfIdentity.mockReturnValue({
      waves: [
        makeWave({
          id: "wave-2",
          name: "Meme Card Curation",
        }),
      ],
      status: "success",
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    });

    render(<UserPageBrainSidebar profile={baseProfile} />);
    const desktopSidebar = screen.getByTestId("brain-sidebar-desktop");
    const mobileStrip = screen.getByTestId("brain-sidebar-mobile-strip");

    expect(
      within(desktopSidebar).getByText("Created Waves")
    ).toBeInTheDocument();
    expect(
      within(desktopSidebar).getByText("TDH Name Vote")
    ).toBeInTheDocument();
    expect(
      within(desktopSidebar).getByText("Most Active In")
    ).toBeInTheDocument();
    expect(
      within(desktopSidebar).getByText("Meme Card Curation")
    ).toBeInTheDocument();
    expect(within(mobileStrip).getByText("Created")).toBeInTheDocument();
    expect(within(mobileStrip).getByText("Active In")).toBeInTheDocument();
    expect(mockedUseWaves).toHaveBeenCalledTimes(1);
    expect(mockedUseWaves).toHaveBeenCalledWith({
      identity: "kanetix",
      waveName: null,
      enabled: true,
      directMessage: false,
      limit: 20,
    });
    expect(mockedUseFavouriteWavesOfIdentity).toHaveBeenCalledWith({
      identityKey: "kanetix",
      limit: 3,
      enabled: true,
    });
  });

  it("does not show a pinned star in the sidebar wave rows", () => {
    mockedUseFavouriteWavesOfIdentity.mockReturnValue({
      waves: [
        makeWave({
          id: "wave-2",
          name: "Pinned Private Wave",
          picture: "https://example.com/wave.png",
          pinned: true,
          visibility: {
            scope: {
              group: {
                id: "group-1",
              },
            },
          },
        }),
      ],
      status: "success",
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    });

    render(<UserPageBrainSidebar profile={baseProfile} />);
    const desktopSidebar = screen.getByTestId("brain-sidebar-desktop");

    expect(
      within(desktopSidebar).getByText("Pinned Private Wave")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("wave-creator-preview-modal")).toBeNull();
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
    expect(mockedUseFavouriteWavesOfIdentity).toHaveBeenCalledWith({
      identityKey: "0xdef",
      limit: 3,
      enabled: true,
    });
  });

  it("hides the created section when there are no created waves", () => {
    mockedUseFavouriteWavesOfIdentity.mockReturnValue({
      waves: [makeWave({ id: "wave-2", name: "Meme Card Curation" })],
      status: "success",
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    });

    render(<UserPageBrainSidebar profile={baseProfile} />);
    const desktopSidebar = screen.getByTestId("brain-sidebar-desktop");

    expect(within(desktopSidebar).queryByText("Created Waves")).toBeNull();
    expect(
      within(desktopSidebar).getByText("Most Active In")
    ).toBeInTheDocument();
    expect(mockedUseWaves).toHaveBeenCalledTimes(1);
  });

  it("hides the most active section when there are no favourite waves", () => {
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
    const desktopSidebar = screen.getByTestId("brain-sidebar-desktop");

    expect(
      within(desktopSidebar).getByText("Created Waves")
    ).toBeInTheDocument();
    expect(within(desktopSidebar).queryByText("Most Active In")).toBeNull();
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
    const desktopSidebar = screen.getByTestId("brain-sidebar-desktop");

    expect(within(desktopSidebar).getByText("Show 1 more")).toBeInTheDocument();
    expect(within(desktopSidebar).queryByText("Meme Card Curation")).toBeNull();

    fireEvent.click(within(desktopSidebar).getByText("Show 1 more"));
    expect(
      within(desktopSidebar).getByText("Meme Card Curation")
    ).toBeInTheDocument();
    expect(within(desktopSidebar).getByText("Show less")).toBeInTheDocument();

    fireEvent.click(within(desktopSidebar).getByText("Show less"));
    expect(within(desktopSidebar).queryByText("Meme Card Curation")).toBeNull();
  });

  it("opens the created waves modal from the compact strip overflow chip", () => {
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
    const mobileStrip = screen.getByTestId("brain-sidebar-mobile-strip");

    fireEvent.click(
      within(mobileStrip).getByRole("button", {
        name: /view all created waves/i,
      })
    );

    expect(screen.getByTestId("wave-creator-preview-modal")).toHaveAttribute(
      "data-user-primary-address",
      "0xabc"
    );
  });
});
