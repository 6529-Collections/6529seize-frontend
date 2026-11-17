import { AuthContext } from "@/components/auth/Auth";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import { ReviewDistributionPlanTableSubscriptionFooter } from "@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscriptionFooter";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useMemo, useState } from "react";

let mockSavedPreparationMode: "UNSTARTED" | "MANUAL" | "BACKGROUND";
const mockRefreshPreparation = jest.fn().mockResolvedValue(undefined);
const mockDownload = jest.fn();
const mockUseDownloader = jest.fn();
const mockGetStagingAuth = jest.fn();
const mockGetAuthJwt = jest.fn();
const mockFetchAllPages = jest.fn();
const mockDistributionAdminWallets = ["0x1"];

jest.mock("@/hooks/useEmmaPreparationMode", () => ({
  useEmmaPreparationMode: () => ({
    mode: mockSavedPreparationMode,
    isError: false,
    refresh: mockRefreshPreparation,
  }),
}));

jest.mock(
  "@/components/distribution-plan-tool/review-distribution-plan/ProcessAndFinalize",
  () => ({
    __esModule: true,
    default: () => <button>Process and Finalize</button>,
  })
);

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
  })
);

jest.mock(
  "@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscription.utils",
  () => ({
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
      distribution_admin_wallets: mockDistributionAdminWallets,
    },
  }),
}));

const {
  isSubscriptionsAdmin,
} = require("@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscription.utils");

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
  mockSavedPreparationMode = "UNSTARTED";
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
  const [showManual, setShowManual] = useState(false);
  const [confirmedTokenId, setConfirmedTokenId] = useState<string | null>(
    initialTokenId
  );
  const distCtx = useMemo(
    () => ({
      distributionPlan: { id: "1", name: "Plan" },
      phases: [
        { id: "p0", name: "Phase 0" },
        { id: "p1", name: "Phase 1" },
        { id: "p2", name: "Phase 2" },
      ],
      confirmedTokenId,
      setConfirmedTokenId,
    }),
    [confirmedTokenId]
  ) as any;

  return (
    <DistributionPlanToolContext.Provider value={distCtx}>
      <AuthContext.Provider value={authCtx}>
        <ReviewDistributionPlanTableSubscriptionFooter
          showManual={showManual}
          onChooseManual={() => setShowManual(true)}
          onClearManualChoice={() => setShowManual(false)}
        />
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
      screen.getByRole("button", { name: /^view artist airdrops$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^view team airdrops$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /upload distribution photos/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^view distribution photos$/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Prepare manually")).toBeInTheDocument();
    expect(screen.getByText("Process and Finalize")).toBeInTheDocument();
    expect(screen.queryByText("Finalize Distribution")).not.toBeInTheDocument();
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
    screen.getByRole("button", { name: /^view distribution photos$/i })
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

  await user.click(
    screen.getByRole("button", { name: /^view artist airdrops$/i })
  );

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
      message: "Subscriptions reset.",
    });
  });
});

test("uses the original normalize request after choosing manual preparation", async () => {
  const user = userEvent.setup();
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);
  const post = jest
    .spyOn(require("@/services/api/common-api"), "commonApiPost")
    .mockResolvedValue({});
  render(<TestWrapper initialTokenId="123" />);
  await user.click(screen.getByRole("button", { name: "Prepare manually" }));
  expect(post).not.toHaveBeenCalled();
  expect(screen.getByText("Process and Finalize")).toBeEnabled();
  await user.click(
    screen.getByRole("button", { name: /Finalize Distribution/ })
  );
  expect(post).toHaveBeenCalledWith(
    expect.objectContaining({
      endpoint: expect.stringMatching(/\/123\/normalize$/),
    })
  );
});

test("uses Process and Finalize instead of the synchronous normalize request", async () => {
  const user = userEvent.setup();
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);
  render(<TestWrapper initialTokenId="123" />);
  await user.click(
    screen.getByRole("button", { name: "Process and Finalize" })
  );
  expect(
    jest.requireMock("@/services/api/common-api").commonApiPost
  ).not.toHaveBeenCalled();
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
      title: "artist airdrops uploaded.",
      description: "Artist uploaded",
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
      title: "team airdrops uploaded.",
      description: "Team uploaded",
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
      title: "Couldn't upload artist airdrops.",
      description: "Please check the CSV and try again.",
      details: "Upload failed",
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
      title: "Couldn't upload artist airdrops.",
      description: "Please check the CSV and try again.",
      details: "Network error. Please check your connection and try again.",
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
    expect(mockUseDownloader).toHaveBeenCalled();
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
      title: "Couldn't download the airdrops CSV.",
      description: "Please try again.",
      details: "wallet is not authorized",
    });
  });
});

test("keeps manual finalization for a plan with saved manual work", async () => {
  mockSavedPreparationMode = "MANUAL";
  render(<TestWrapper initialTokenId="123" />);
  const finishing = within(
    screen.getByRole("region", { name: "Finish distribution" })
  );
  const [finalize, publish] = finishing.getAllByRole("button");
  expect(finalize).toHaveAccessibleName("Finalize Distribution");
  expect(finalize).toBeEnabled();
  expect(publish).toHaveAccessibleName("Publish to GitHub");
  await waitFor(() =>
    expect(publish).toHaveAccessibleDescription(
      "Finalize and normalize the distribution first"
    )
  );
  expect(finalize).toHaveAccessibleDescription("Not finalized");
  expect(
    screen.getByText(/Manual work is saved. Use Reset Subscriptions/)
  ).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "Process and Finalize" })
  ).toBeNull();
});

test("describes a finalized manual distribution without changing the button name", async () => {
  mockSavedPreparationMode = "MANUAL";
  jest
    .spyOn(require("@/services/api/common-api"), "commonApiFetch")
    .mockResolvedValue(createOverview({ is_normalized: true }));

  render(<TestWrapper initialTokenId="123" />);

  const finalize = screen.getByRole("button", {
    name: "Finalize Distribution",
  });
  await waitFor(() =>
    expect(finalize).toHaveAccessibleDescription("Finalized")
  );
});

test("keeps the background job controls visible for a plan with a saved job", async () => {
  mockSavedPreparationMode = "BACKGROUND";
  render(<TestWrapper initialTokenId="123" />);
  expect(
    await screen.findByRole("button", { name: "Process and Finalize" })
  ).toBeVisible();
  expect(
    screen.queryByRole("button", { name: /Finalize Distribution/i })
  ).toBeNull();
});

test("explains preparation choices and resetting in the information dialog", async () => {
  const user = userEvent.setup();
  render(<TestWrapper initialTokenId="123" />);
  const info = screen.getByRole("button", {
    name: "About distribution preparation",
  });
  await user.click(info);

  const dialog = within(
    screen.getByRole("dialog", { name: "Prepare distribution" })
  );
  expect(dialog.getByText("Prepare manually")).toBeVisible();
  expect(dialog.getByText("Process and Finalize")).toBeVisible();
  expect(
    dialog.getByText(/Artist and team airdrop uploads are kept/)
  ).toBeVisible();
  await user.keyboard("{Escape}");
  await waitFor(() =>
    expect(
      screen.queryByRole("dialog", { name: "Prepare distribution" })
    ).toBeNull()
  );
  await waitFor(() => expect(info).toHaveFocus());
});

test("shows both choices after resetting subscriptions", async () => {
  const user = userEvent.setup();
  const post = jest
    .spyOn(require("@/services/api/common-api"), "commonApiPost")
    .mockResolvedValue({});
  render(<TestWrapper initialTokenId="123" />);

  await user.click(screen.getByRole("button", { name: "Prepare manually" }));
  expect(screen.getByText("Finalize Distribution")).toBeVisible();
  await user.click(screen.getByText("Reset Subscriptions"));

  expect(
    await screen.findByRole("button", { name: "Prepare manually" })
  ).toBeEnabled();
  expect(
    screen.getByRole("button", { name: "Process and Finalize" })
  ).toBeEnabled();
  expect(screen.queryByText("Finalize Distribution")).not.toBeInTheDocument();
  expect(post).toHaveBeenCalledTimes(1);
});
