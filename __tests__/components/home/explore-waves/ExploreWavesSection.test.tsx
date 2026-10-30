import { renderWithQueryClient } from "../../../utils/reactQuery";
import { ExploreWavesSection } from "@/components/home/explore-waves/ExploreWavesSection";
import { fetchWavesV2Page } from "@/services/api/waves-v2-api";
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { ApiWaveScoreSort } from "@/generated/models/ApiWaveScoreSort";
import { ApiWavesOverviewType } from "@/generated/models/ApiWavesOverviewType";

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/components/home/explore-waves/ExploreWaveCard", () => ({
  ExploreWaveCard: ({
    wave,
    horizontalOnMobile,
    artworkOverlay,
  }: {
    readonly wave: { readonly name: string };
    readonly horizontalOnMobile?: boolean;
    readonly artworkOverlay?: boolean;
  }) => (
    <div
      data-horizontal-on-mobile={horizontalOnMobile}
      data-artwork-overlay={artworkOverlay}
    >
      {wave.name}
    </div>
  ),
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

  it.each([
    ["default", "true"],
    ["page", "false"],
  ] as const)(
    "selects the %s card presentation without changing the query",
    async (headingVariant, horizontalOnMobile) => {
      useAuthMock.mockReturnValue({ connectedProfile: null });
      renderWithQueryClient(
        <ExploreWavesSection headingVariant={headingVariant} />
      );
      expect(await screen.findByText("Scored wave")).toHaveAttribute(
        "data-horizontal-on-mobile",
        horizontalOnMobile
      );
      expect(screen.getByText("Scored wave")).toHaveAttribute(
        "data-artwork-overlay",
        String(headingVariant === "page")
      );
      expect(fetchWavesV2PageMock).toHaveBeenCalledTimes(1);
      expect(fetchWavesV2PageMock).toHaveBeenCalledWith(
        expect.objectContaining({ pageSize: 6 })
      );
    }
  );

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

describe("ExploreWavesSection load failures", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthMock.mockReturnValue({ connectedProfile: null });
    fetchWavesV2PageMock.mockResolvedValue({
      waves: [{ id: "wave-1", name: "Scored wave" }],
      page: 1,
      next: null,
    });
  });

  it("shows an alert with retry instead of a blank section on discovery", async () => {
    fetchWavesV2PageMock.mockRejectedValueOnce(new Error("offline"));

    renderWithQueryClient(
      <ExploreWavesSection
        headingVariant="page"
        title="Active discussions"
        statusLabel="Balanced waves"
        showEmptyState
        headerControls={<div>Sort controls</div>}
      />
    );

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "Could not load Balanced waves. Please try again."
    );
    expect(
      screen.getByRole("heading", { name: "Active discussions" })
    ).toBeInTheDocument();
    expect(screen.getByText("Sort controls")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    fireEvent.click(within(alert).getByRole("button", { name: "Try again" }));
    expect(alert.parentElement).toHaveFocus();

    expect(await screen.findByText("Scored wave")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(fetchWavesV2PageMock).toHaveBeenCalledTimes(2);
  });

  it("keeps the section hidden on failure where empty states are not shown", async () => {
    fetchWavesV2PageMock.mockRejectedValueOnce(new Error("offline"));

    const { container } = renderWithQueryClient(<ExploreWavesSection />);

    await waitFor(() => expect(container).toBeEmptyDOMElement());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps loaded waves on screen when a later refetch fails", async () => {
    const { queryClient } = renderWithQueryClient(
      <ExploreWavesSection showEmptyState />
    );
    expect(await screen.findByText("Scored wave")).toBeInTheDocument();

    fetchWavesV2PageMock.mockRejectedValueOnce(new Error("offline"));
    await act(async () => {
      await queryClient.refetchQueries({ queryKey: ["explore-waves"] });
    });

    expect(fetchWavesV2PageMock).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Scored wave")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
