import { renderWithQueryClient } from "../../../utils/reactQuery";
import { ExploreWavesSection } from "@/components/home/explore-waves/ExploreWavesSection";
import { fetchWavesV2Page } from "@/services/api/waves-v2-api";
import { screen, waitFor } from "@testing-library/react";
import { ApiWaveScoreSort } from "@/generated/models/ApiWaveScoreSort";
import { ApiWavesOverviewType } from "@/generated/models/ApiWavesOverviewType";

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/components/home/explore-waves/ExploreWaveCard", () => ({
  ExploreWaveCard: ({
    wave,
    variant,
  }: {
    readonly wave: { readonly name: string };
    readonly variant?: string;
  }) => <div data-card-variant={variant}>{wave.name}</div>,
}));

jest.mock("@/components/home/explore-waves/ExploreWaveCardSkeleton", () => ({
  ExploreWaveCardSkeleton: () => <div>Loading wave</div>,
}));

jest.mock("@/services/api/waves-v2-api", () => ({
  fetchWavesV2Page: jest.fn(),
}));

const useAuthMock = require("@/components/auth/Auth").useAuth as jest.Mock;
const fetchWavesV2PageMock = fetchWavesV2Page as jest.Mock;

describe("ExploreWavesSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchWavesV2PageMock.mockResolvedValue({
      waves: [{ id: "wave-1", name: "Scored wave" }],
      page: 1,
      next: null,
    });
  });

  it.each(["home", "default"] as const)(
    "uses the explicitly selected %s card without changing the query",
    async (variant) => {
      useAuthMock.mockReturnValue({ connectedProfile: null });
      renderWithQueryClient(<ExploreWavesSection cardVariant={variant} />);
      expect(await screen.findByText("Scored wave")).toHaveAttribute(
        "data-card-variant",
        variant
      );
      expect(fetchWavesV2PageMock).toHaveBeenCalledTimes(1);
      expect(fetchWavesV2PageMock).toHaveBeenCalledWith(
        expect.objectContaining({ pageSize: 6 })
      );
    }
  );

  it("keeps discovery on its existing card variant by default", async () => {
    useAuthMock.mockReturnValue({ connectedProfile: null });
    renderWithQueryClient(<ExploreWavesSection headingVariant="page" />);
    expect(await screen.findByText("Scored wave")).toHaveAttribute(
      "data-card-variant",
      "default"
    );
  });

  it("does not request followed-wave exclusion for anonymous discovery", async () => {
    useAuthMock.mockReturnValue({ connectedProfile: null });

    renderWithQueryClient(
      <ExploreWavesSection excludeFollowed showEmptyState />
    );

    await waitFor(() => expect(fetchWavesV2PageMock).toHaveBeenCalled());
    expect(fetchWavesV2PageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        excludeFollowed: undefined,
      })
    );
  });

  it("requests followed-wave exclusion after a profile is connected", async () => {
    useAuthMock.mockReturnValue({
      connectedProfile: { id: "profile-1", handle: "alice" },
    });

    renderWithQueryClient(
      <ExploreWavesSection excludeFollowed showEmptyState />
    );

    await waitFor(() => expect(fetchWavesV2PageMock).toHaveBeenCalled());
    expect(fetchWavesV2PageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        excludeFollowed: true,
      })
    );
  });

  it("defaults score sort only for scored discovery overview", async () => {
    useAuthMock.mockReturnValue({ connectedProfile: null });

    renderWithQueryClient(<ExploreWavesSection showEmptyState />);

    await waitFor(() => expect(fetchWavesV2PageMock).toHaveBeenCalled());
    expect(fetchWavesV2PageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        overviewType: ApiWavesOverviewType.ScoredRecentlyDroppedTo,
        scoreSort: ApiWaveScoreSort.Balanced,
      })
    );
  });

  it("does not send score sort for latest-post overview", async () => {
    useAuthMock.mockReturnValue({ connectedProfile: null });

    renderWithQueryClient(
      <ExploreWavesSection
        overviewType={ApiWavesOverviewType.RecentlyDroppedTo}
        showEmptyState
      />
    );

    await waitFor(() => expect(fetchWavesV2PageMock).toHaveBeenCalled());
    expect(fetchWavesV2PageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        overviewType: ApiWavesOverviewType.RecentlyDroppedTo,
        scoreSort: undefined,
      })
    );
  });
});
