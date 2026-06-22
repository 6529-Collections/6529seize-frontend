import { AuthContext } from "@/components/auth/Auth";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import { ReviewDistributionPlanTableSubscriptionFooter } from "@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscriptionFooter";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useMemo, useState } from "react";

const mockDownload = jest.fn();
const mockUseDownloader = jest.fn();
const mockGetStagingAuth = jest.fn();
const mockGetAuthJwt = jest.fn();
const mockFetchAllPages = jest.fn();

jest.mock("react-use-downloader", () => ({
  __esModule: true,
  default: (...args: any[]) => mockUseDownloader(...args),
}));

jest.mock("@/services/auth/auth.utils", () => ({
  getStagingAuth: () => mockGetStagingAuth(),
  getAuthJwt: () => mockGetAuthJwt(),
}));

jest.mock("@/services/6529api", () => ({
  fetchAllPages: (...args: any[]) => mockFetchAllPages(...args),
}));

jest.mock(
  "@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscription",
  () => ({
    download: jest.fn(async () => ({ success: true, message: "ok" })),
    isSubscriptionsAdmin: jest.fn(),
  })
);

jest.mock(
  "@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscriptionFooterUploadPhotos",
  () => ({
    UploadDistributionPhotosModal: () => (
      <div data-testid="Upload Distribution Photos" />
    ),
  })
);

jest.mock(
  "@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscriptionFooterPhaseAirdrops",
  () => ({
    DistributionPhaseAirdropsModal: (props: any) => (
      <div data-testid={`${props.phase}-airdrops-modal`}>
        <button
          data-testid={`upload-${props.phase}-airdrops-button`}
          onClick={() =>
            props.onUpload("contract", "123", props.phase, "0x123,5\n0x456,10")
          }
        >
          Upload
        </button>
      </div>
    ),
  })
);

jest.mock(
  "@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscriptionFooterPhaseAirdropsViewer",
  () => ({
    DistributionPhaseAirdropsViewerModal: (props: any) => (
      <div data-testid={`${props.phase}-airdrops-viewer-modal`}>
        <div>{props.isLoading ? "Loading" : "Loaded"}</div>
        <div>{`Error: ${props.error ?? "none"}`}</div>
        <div>{`Rows: ${props.rows.length}`}</div>
      </div>
    ),
  })
);

jest.mock(
  "@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscriptionFooterPhotosViewer",
  () => ({
    DistributionPhotosViewerModal: (props: any) => (
      <div data-testid="distribution-photos-viewer-modal">
        <div>{props.isLoading ? "Loading photos" : "Loaded photos"}</div>
        <div>{`Photo error: ${props.error ?? "none"}`}</div>
        <div>{`Photos: ${props.photos.length}`}</div>
      </div>
    ),
  })
);

jest.mock(
  "@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscriptionFooterConfirmTokenId",
  () => ({
    ConfirmTokenIdModal: (props: any) => (
      <div data-testid="Confirm Token ID">
        <button
          data-testid="confirm-token-id-button"
          onClick={() => props.onConfirm("123")}
        >
          Confirm
        </button>
      </div>
    ),
  })
);

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: () => ({
    seizeSettings: {
      distribution_admin_wallets: ["0x1"],
    },
  }),
}));

const {
  isSubscriptionsAdmin,
} = require("@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscription");

const authCtx = {
  connectedProfile: { wallets: [{ wallet: "0x1" }] },
  setToast: jest.fn(),
} as any;

function createOverview(overrides?: Record<string, unknown>) {
  return {
    photos_count: 0,
    is_normalized: false,
    artist_airdrops_addresses: 0,
    artist_airdrops_count: 0,
    team_airdrops_addresses: 0,
    team_airdrops_count: 0,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  authCtx.setToast.mockClear();
  mockDownload.mockReset();
  mockUseDownloader.mockReset();
  mockGetStagingAuth.mockReset();
  mockGetAuthJwt.mockReset();
  mockFetchAllPages.mockReset();
  mockDownload.mockResolvedValue(undefined);
  mockGetStagingAuth.mockReturnValue(null);
  mockGetAuthJwt.mockReturnValue(null);
  mockFetchAllPages.mockResolvedValue([]);
  mockUseDownloader.mockReturnValue({
    download: mockDownload,
    error: null,
  });
  jest
    .spyOn(require("@/services/api/common-api"), "commonApiFetch")
    .mockResolvedValue(createOverview());
});

afterEach(() => {
  jest.restoreAllMocks();
});

function TestWrapper({
  initialTokenId = null,
}: {
  readonly initialTokenId?: string | null | undefined;
}) {
  const [confirmedTokenId, setConfirmedTokenId] = useState<string | null>(
    initialTokenId
  );
  const distCtx = useMemo(
    () => ({
      distributionPlan: { id: "1", name: "Plan" },
      confirmedTokenId,
      setConfirmedTokenId,
    }),
    [confirmedTokenId]
  ) as any;

  return (
    <DistributionPlanToolContext.Provider value={distCtx}>
      <AuthContext.Provider value={authCtx}>
        <ReviewDistributionPlanTableSubscriptionFooter />
      </AuthContext.Provider>
    </DistributionPlanToolContext.Provider>
  );
}

test("returns empty when not admin", () => {
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(false);
  const { container } = render(<TestWrapper />);
  expect(container.innerHTML).toBe("");
});

test("shows confirm token id modal on mount for admin", () => {
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);
  render(<TestWrapper />);
  expect(screen.getByTestId("Confirm Token ID")).toBeInTheDocument();
});

test("renders split admin controls after token id is confirmed", async () => {
  const user = userEvent.setup();
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);
  render(<TestWrapper />);

  await user.click(screen.getByTestId("confirm-token-id-button"));

  await waitFor(() => {
    expect(screen.getByText("Change Token ID")).toBeInTheDocument();
    expect(screen.getByText("Reset Subscriptions")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /upload artist airdrops/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /upload team airdrops/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^artist airdrops$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^team airdrops$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /upload distribution photos/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /distribution photos \(0\)/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Finalize Distribution")).toBeInTheDocument();
    expect(screen.getByText("Publish to GitHub")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /download artist airdrops csv/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /download team airdrops csv/i })
    ).toBeInTheDocument();
  });
});

test("displays contract and token id after confirmation", async () => {
  const user = userEvent.setup();
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);
  render(<TestWrapper />);

  await user.click(screen.getByTestId("confirm-token-id-button"));

  await waitFor(() => {
    expect(screen.getByText(/Contract: The Memes/)).toBeInTheDocument();
    expect(screen.getByText(/Token ID: 123/)).toBeInTheDocument();
  });
});

test("shows upload modals when upload buttons clicked", async () => {
  const user = userEvent.setup();
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);
  render(<TestWrapper />);

  await user.click(screen.getByTestId("confirm-token-id-button"));

  await waitFor(() => {
    expect(
      screen.getByRole("button", { name: /upload distribution photos/i })
    ).toBeInTheDocument();
  });

  await user.click(
    screen.getByRole("button", { name: /upload distribution photos/i })
  );
  await waitFor(() => {
    expect(
      screen.getByTestId("Upload Distribution Photos")
    ).toBeInTheDocument();
  });

  await user.click(
    screen.getByRole("button", { name: /upload artist airdrops/i })
  );
  await waitFor(() => {
    expect(screen.getByTestId("artist-airdrops-modal")).toBeInTheDocument();
  });

  await user.click(
    screen.getByRole("button", { name: /upload team airdrops/i })
  );
  await waitFor(() => {
    expect(screen.getByTestId("team-airdrops-modal")).toBeInTheDocument();
  });
});

test("loads distribution photos into a viewer modal from the photos endpoint", async () => {
  const user = userEvent.setup();
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);
  mockFetchAllPages.mockResolvedValue([
    { id: 1, link: "https://example.com/1.jpg" },
    { id: 2, link: "https://example.com/2.jpg" },
  ]);

  render(<TestWrapper initialTokenId="123" />);

  await user.click(
    screen.getByRole("button", { name: /distribution photos \(0\)/i })
  );

  await waitFor(() => {
    expect(mockFetchAllPages).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/distribution_photos/0x33FD426905F149f8376e227d0C9D3340AaD17aF1/123"
    );
    expect(
      screen.getByTestId("distribution-photos-viewer-modal")
    ).toBeInTheDocument();
    expect(screen.getByText("Loaded photos")).toBeInTheDocument();
    expect(screen.getByText("Photos: 2")).toBeInTheDocument();
  });
});

test("loads artist airdrops into a viewer modal from the get endpoint", async () => {
  const user = userEvent.setup();
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);
  const commonApiFetch = jest
    .spyOn(require("@/services/api/common-api"), "commonApiFetch")
    .mockImplementation(({ endpoint }: { endpoint: string }) => {
      if (endpoint.includes("/artist-airdrops")) {
        return Promise.resolve([
          { wallet: "0x123", amount: 5 },
          { wallet: "0x456", amount: 10 },
        ]);
      }

      return Promise.resolve(
        createOverview({
          artist_airdrops_addresses: 2,
          artist_airdrops_count: 15,
        })
      );
    });

  render(<TestWrapper initialTokenId="123" />);

  await user.click(screen.getByRole("button", { name: /^artist airdrops$/i }));

  await waitFor(() => {
    expect(commonApiFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: expect.stringContaining("/artist-airdrops"),
      })
    );
    expect(
      screen.getByTestId("artist-airdrops-viewer-modal")
    ).toBeInTheDocument();
    expect(screen.getByText("Loaded")).toBeInTheDocument();
    expect(screen.getByText("Rows: 2")).toBeInTheDocument();
  });
});

test("change token id button opens confirm modal", async () => {
  const user = userEvent.setup();
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);
  render(<TestWrapper />);

  await user.click(screen.getByTestId("confirm-token-id-button"));

  await waitFor(() => {
    expect(screen.getByText("Change Token ID")).toBeInTheDocument();
  });

  await user.click(screen.getByText("Change Token ID"));

  await waitFor(() => {
    expect(screen.getByTestId("Confirm Token ID")).toBeInTheDocument();
  });
});

test("resetSubscriptions posts data and shows toast directly", async () => {
  const user = userEvent.setup();
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);
  const commonApiPost = jest.fn().mockResolvedValue({});
  jest
    .spyOn(require("@/services/api/common-api"), "commonApiPost")
    .mockImplementation(commonApiPost);

  jest
    .spyOn(require("@/services/api/common-api"), "commonApiFetch")
    .mockResolvedValue(createOverview());

  render(<TestWrapper />);

  await user.click(screen.getByTestId("confirm-token-id-button"));

  await waitFor(() => {
    expect(screen.getByText("Reset Subscriptions")).toBeInTheDocument();
  });

  await user.click(screen.getByText("Reset Subscriptions"));

  await waitFor(() => {
    expect(commonApiPost).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: expect.stringContaining("/reset"),
      })
    );
    expect(authCtx.setToast).toHaveBeenCalledWith({
      type: "success",
      message: "Subscriptions reset successfully.",
    });
  });
});

test("finalizeDistribution posts data and shows toast directly", async () => {
  const user = userEvent.setup();
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);
  const commonApiPost = jest
    .fn()
    .mockResolvedValue({ success: true, message: "Normalized" });
  jest
    .spyOn(require("@/services/api/common-api"), "commonApiPost")
    .mockImplementation(commonApiPost);

  jest
    .spyOn(require("@/services/api/common-api"), "commonApiFetch")
    .mockResolvedValue(createOverview());

  render(<TestWrapper />);

  await user.click(screen.getByTestId("confirm-token-id-button"));

  await waitFor(() => {
    expect(screen.getByText("Finalize Distribution")).toBeInTheDocument();
  });

  await user.click(screen.getByText("Finalize Distribution"));

  await waitFor(() => {
    expect(commonApiPost).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: expect.stringContaining("/normalize"),
      })
    );
    expect(authCtx.setToast).toHaveBeenCalledWith({
      type: "success",
      message: "Normalized",
    });
  });
});

test("upload artist airdrops posts csv data and shows success toast", async () => {
  const user = userEvent.setup();
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);
  const commonApiPost = jest
    .fn()
    .mockResolvedValue({ success: true, message: "Artist uploaded" });
  jest
    .spyOn(require("@/services/api/common-api"), "commonApiPost")
    .mockImplementation(commonApiPost);

  const commonApiFetch = jest
    .spyOn(require("@/services/api/common-api"), "commonApiFetch")
    .mockResolvedValue(
      createOverview({
        artist_airdrops_addresses: 2,
        artist_airdrops_count: 15,
      })
    );

  render(<TestWrapper initialTokenId="123" />);

  await waitFor(() => {
    expect(
      screen.getByRole("button", { name: /upload artist airdrops/i })
    ).toBeInTheDocument();
  });

  await user.click(
    screen.getByRole("button", { name: /upload artist airdrops/i })
  );
  await waitFor(() => {
    expect(screen.getByTestId("artist-airdrops-modal")).toBeInTheDocument();
  });

  await user.click(screen.getByTestId("upload-artist-airdrops-button"));

  await waitFor(() => {
    expect(commonApiPost).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: expect.stringContaining("/artist-airdrops"),
        body: { csv: "0x123,5\n0x456,10" },
      })
    );
    expect(authCtx.setToast).toHaveBeenCalledWith({
      type: "success",
      message: "Artist uploaded",
    });
    expect(commonApiFetch).toHaveBeenCalled();
  });
});

test("upload team airdrops posts csv data and shows success toast", async () => {
  const user = userEvent.setup();
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);
  const commonApiPost = jest
    .fn()
    .mockResolvedValue({ success: true, message: "Team uploaded" });
  jest
    .spyOn(require("@/services/api/common-api"), "commonApiPost")
    .mockImplementation(commonApiPost);

  render(<TestWrapper initialTokenId="123" />);

  await waitFor(() => {
    expect(
      screen.getByRole("button", { name: /upload team airdrops/i })
    ).toBeInTheDocument();
  });

  await user.click(
    screen.getByRole("button", { name: /upload team airdrops/i })
  );
  await waitFor(() => {
    expect(screen.getByTestId("team-airdrops-modal")).toBeInTheDocument();
  });

  await user.click(screen.getByTestId("upload-team-airdrops-button"));

  await waitFor(() => {
    expect(authCtx.setToast).toHaveBeenCalledWith({
      type: "success",
      message: "Team uploaded",
    });
    expect(commonApiPost).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: expect.stringContaining("/team-airdrops"),
        body: { csv: "0x123,5\n0x456,10" },
      })
    );
  });
});

test("upload artist airdrops shows error toast on failure", async () => {
  const user = userEvent.setup();
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);
  const commonApiPost = jest
    .fn()
    .mockResolvedValue({ success: false, error: "Upload failed" });
  jest
    .spyOn(require("@/services/api/common-api"), "commonApiPost")
    .mockImplementation(commonApiPost);

  render(<TestWrapper initialTokenId="123" />);

  await waitFor(() => {
    expect(
      screen.getByRole("button", { name: /upload artist airdrops/i })
    ).toBeInTheDocument();
  });

  await user.click(
    screen.getByRole("button", { name: /upload artist airdrops/i })
  );
  await waitFor(() => {
    expect(screen.getByTestId("artist-airdrops-modal")).toBeInTheDocument();
  });

  await user.click(screen.getByTestId("upload-artist-airdrops-button"));

  await waitFor(() => {
    expect(authCtx.setToast).toHaveBeenCalledWith({
      type: "error",
      message: "Upload failed",
    });
  });
});

test("upload artist airdrops handles exceptions", async () => {
  const user = userEvent.setup();
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);
  const commonApiPost = jest.fn().mockRejectedValue(new Error("Network error"));
  jest
    .spyOn(require("@/services/api/common-api"), "commonApiPost")
    .mockImplementation(commonApiPost);

  render(<TestWrapper initialTokenId="123" />);

  await waitFor(() => {
    expect(
      screen.getByRole("button", { name: /upload artist airdrops/i })
    ).toBeInTheDocument();
  });

  await user.click(
    screen.getByRole("button", { name: /upload artist airdrops/i })
  );
  await waitFor(() => {
    expect(screen.getByTestId("artist-airdrops-modal")).toBeInTheDocument();
  });

  await user.click(screen.getByTestId("upload-artist-airdrops-button"));

  await waitFor(() => {
    expect(authCtx.setToast).toHaveBeenCalledWith({
      type: "error",
      message: "Network error",
    });
  });
});

test("disables phase csv downloads when there are no values", async () => {
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);

  render(<TestWrapper initialTokenId="123" />);

  const artistDownloadButton = await screen.findByRole("button", {
    name: /download artist airdrops csv/i,
  });
  const teamDownloadButton = await screen.findByRole("button", {
    name: /download team airdrops csv/i,
  });

  expect(artistDownloadButton).toBeDisabled();
  expect(teamDownloadButton).toBeDisabled();
});

test("downloads artist airdrops csv with the response filename", async () => {
  const user = userEvent.setup();
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);
  mockGetStagingAuth.mockReturnValue("staging-token");
  mockGetAuthJwt.mockReturnValue("wallet-token");

  jest
    .spyOn(require("@/services/api/common-api"), "commonApiFetch")
    .mockResolvedValue(
      createOverview({
        artist_airdrops_addresses: 2,
        artist_airdrops_count: 15,
      })
    );

  render(<TestWrapper initialTokenId="123" />);

  const downloadButton = await screen.findByRole("button", {
    name: /download artist airdrops csv/i,
  });

  await waitFor(() => expect(downloadButton).toBeEnabled());
  await user.click(downloadButton);

  await waitFor(() => {
    expect(mockUseDownloader).toHaveBeenCalledWith();
    expect(mockDownload).toHaveBeenCalledWith(
      expect.stringContaining(
        "/api/distributions/0x33FD426905F149f8376e227d0C9D3340AaD17aF1/123/artist-airdrops"
      ),
      "artist_airdrops_123.csv",
      undefined,
      {
        headers: {
          Accept: "text/csv",
          "x-6529-auth": "staging-token",
          Authorization: "Bearer wallet-token",
        },
      }
    );
  });
});

test("downloads team airdrops csv with the response filename", async () => {
  const user = userEvent.setup();
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);

  jest
    .spyOn(require("@/services/api/common-api"), "commonApiFetch")
    .mockResolvedValue(
      createOverview({
        team_airdrops_addresses: 1,
        team_airdrops_count: 5,
      })
    );

  render(<TestWrapper initialTokenId="123" />);

  const downloadButton = await screen.findByRole("button", {
    name: /download team airdrops csv/i,
  });

  await waitFor(() => expect(downloadButton).toBeEnabled());
  await user.click(downloadButton);

  await waitFor(() => {
    expect(mockDownload).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/distributions/0x33FD426905F149f8376e227d0C9D3340AaD17aF1/123/team-airdrops",
      "team_airdrops_123.csv",
      undefined,
      {
        headers: {
          Accept: "text/csv",
        },
      }
    );
  });
});

test("artist download loading state does not disable team download", async () => {
  const user = userEvent.setup();
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);

  let resolveDownload: (() => void) | null = null;
  mockDownload.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        resolveDownload = resolve;
      })
  );

  jest
    .spyOn(require("@/services/api/common-api"), "commonApiFetch")
    .mockResolvedValue(
      createOverview({
        artist_airdrops_addresses: 2,
        artist_airdrops_count: 15,
        team_airdrops_addresses: 1,
        team_airdrops_count: 5,
      })
    );

  render(<TestWrapper initialTokenId="123" />);

  const artistDownloadButton = await screen.findByRole("button", {
    name: /download artist airdrops csv/i,
  });
  const teamDownloadButton = await screen.findByRole("button", {
    name: /download team airdrops csv/i,
  });

  await waitFor(() => {
    expect(artistDownloadButton).toBeEnabled();
    expect(teamDownloadButton).toBeEnabled();
  });

  await user.click(artistDownloadButton);

  await waitFor(() => {
    expect(artistDownloadButton).toBeDisabled();
    expect(teamDownloadButton).toBeEnabled();
  });

  resolveDownload?.();

  await waitFor(() => {
    expect(artistDownloadButton).toBeEnabled();
  });
});

test("shows an admin-facing error when the downloader reports one", async () => {
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);

  jest
    .spyOn(require("@/services/api/common-api"), "commonApiFetch")
    .mockResolvedValue(
      createOverview({
        artist_airdrops_addresses: 1,
        artist_airdrops_count: 5,
      })
    );

  mockUseDownloader.mockReturnValue({
    download: mockDownload,
    error: { errorMessage: "wallet is not authorized" },
  });

  render(<TestWrapper initialTokenId="123" />);

  await waitFor(() => {
    expect(authCtx.setToast).toHaveBeenCalledWith({
      type: "error",
      message: "wallet is not authorized",
    });
  });
});
