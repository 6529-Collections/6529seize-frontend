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

jest.mock("react-use-downloader", () => ({
  __esModule: true,
  default: (...args: any[]) => mockUseDownloader(...args),
}));

jest.mock("@/services/auth/auth.utils", () => ({
  getStagingAuth: () => mockGetStagingAuth(),
  getAuthJwt: () => mockGetAuthJwt(),
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
    UploadDistributionPhotosModal: (props: any) =>
      props.show ? <div data-testid="Upload Distribution Photos" /> : null,
  })
);

jest.mock(
  "@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscriptionFooterAutomaticAirdrops",
  () => ({
    AutomaticAirdropsModal: (props: any) =>
      props.show ? (
        <div data-testid="Automatic Airdrops">
          <button
            data-testid="upload-airdrops-button"
            onClick={() =>
              props.onUpload("contract", "123", "0x123,5\n0x456,10")
            }
          >
            Upload
          </button>
        </div>
      ) : null,
  })
);

jest.mock(
  "@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscriptionFooterConfirmTokenId",
  () => ({
    ConfirmTokenIdModal: (props: any) =>
      props.show ? (
        <div data-testid="Confirm Token ID">
          <button
            data-testid="confirm-token-id-button"
            onClick={() => props.onConfirm("123")}
          >
            Confirm
          </button>
        </div>
      ) : null,
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

beforeEach(() => {
  jest.clearAllMocks();
  authCtx.setToast.mockClear();
  mockDownload.mockReset();
  mockUseDownloader.mockReset();
  mockGetStagingAuth.mockReset();
  mockGetAuthJwt.mockReset();
  mockDownload.mockResolvedValue(undefined);
  mockGetStagingAuth.mockReturnValue(null);
  mockGetAuthJwt.mockReturnValue(null);
  mockUseDownloader.mockReturnValue({
    download: mockDownload,
    isInProgress: false,
    error: null,
  });
  jest
    .spyOn(require("@/services/api/common-api"), "commonApiFetch")
    .mockResolvedValue({
      photos_count: 0,
      is_normalized: false,
      automatic_airdrops_addresses: 0,
      automatic_airdrops_count: 0,
    });
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

test("renders admin buttons after token id is confirmed", async () => {
  const user = userEvent.setup();
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);
  render(<TestWrapper />);

  await user.click(screen.getByTestId("confirm-token-id-button"));

  await waitFor(() => {
    expect(screen.getByText("Change Token ID")).toBeInTheDocument();
    expect(screen.getByText("Reset Subscriptions")).toBeInTheDocument();
    expect(screen.getByText("Upload Distribution Photos")).toBeInTheDocument();
    expect(screen.getByText("Upload Automatic Airdrops")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /download automatic airdrops csv/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Finalize Distribution")).toBeInTheDocument();
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
    expect(screen.getByText("Upload Distribution Photos")).toBeInTheDocument();
  });

  await user.click(screen.getByText("Upload Distribution Photos"));
  await waitFor(() => {
    expect(
      screen.getByTestId("Upload Distribution Photos")
    ).toBeInTheDocument();
  });

  await user.click(screen.getByText("Upload Automatic Airdrops"));
  await waitFor(() => {
    expect(screen.getByTestId("Automatic Airdrops")).toBeInTheDocument();
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
    .mockResolvedValue({ photos_count: 0, is_normalized: false });

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
    .mockResolvedValue({ photos_count: 0, is_normalized: false });

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

test("uploadAutomaticAirdrops posts CSV data and shows success toast", async () => {
  const user = userEvent.setup();
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);
  const commonApiPost = jest
    .fn()
    .mockResolvedValue({ success: true, message: "Airdrops uploaded" });
  jest
    .spyOn(require("@/services/api/common-api"), "commonApiPost")
    .mockImplementation(commonApiPost);

  const commonApiFetch = jest
    .spyOn(require("@/services/api/common-api"), "commonApiFetch")
    .mockResolvedValue({
      photos_count: 0,
      is_normalized: false,
      automatic_airdrops_addresses: 2,
      automatic_airdrops_count: 15,
    });

  render(<TestWrapper initialTokenId="123" />);

  await waitFor(() => {
    expect(screen.getByText("Upload Automatic Airdrops")).toBeInTheDocument();
  });

  await user.click(screen.getByText("Upload Automatic Airdrops"));
  await waitFor(() => {
    expect(screen.getByTestId("Automatic Airdrops")).toBeInTheDocument();
  });

  await user.click(screen.getByTestId("upload-airdrops-button"));

  await waitFor(() => {
    expect(commonApiPost).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: expect.stringContaining("/automatic_airdrops"),
        body: { csv: "0x123,5\n0x456,10" },
      })
    );
    expect(authCtx.setToast).toHaveBeenCalledWith({
      type: "success",
      message: "Airdrops uploaded",
    });
    expect(commonApiFetch).toHaveBeenCalled();
  });
});

test("uploadAutomaticAirdrops shows error toast on failure", async () => {
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
    expect(screen.getByText("Upload Automatic Airdrops")).toBeInTheDocument();
  });

  await user.click(screen.getByText("Upload Automatic Airdrops"));
  await waitFor(() => {
    expect(screen.getByTestId("Automatic Airdrops")).toBeInTheDocument();
  });

  await user.click(screen.getByTestId("upload-airdrops-button"));

  await waitFor(() => {
    expect(authCtx.setToast).toHaveBeenCalledWith({
      type: "error",
      message: "Upload failed",
    });
  });
});

test("uploadAutomaticAirdrops handles exceptions", async () => {
  const user = userEvent.setup();
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);
  const commonApiPost = jest.fn().mockRejectedValue(new Error("Network error"));
  jest
    .spyOn(require("@/services/api/common-api"), "commonApiPost")
    .mockImplementation(commonApiPost);

  render(<TestWrapper initialTokenId="123" />);

  await waitFor(() => {
    expect(screen.getByText("Upload Automatic Airdrops")).toBeInTheDocument();
  });

  await user.click(screen.getByText("Upload Automatic Airdrops"));
  await waitFor(() => {
    expect(screen.getByTestId("Automatic Airdrops")).toBeInTheDocument();
  });

  await user.click(screen.getByTestId("upload-airdrops-button"));

  await waitFor(() => {
    expect(authCtx.setToast).toHaveBeenCalledWith({
      type: "error",
      message: "Network error",
    });
  });
});

test("disables automatic airdrops csv download when there are no values", async () => {
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);

  render(<TestWrapper initialTokenId="123" />);

  const downloadButton = await screen.findByRole("button", {
    name: /download automatic airdrops csv/i,
  });

  expect(downloadButton).toBeDisabled();
});

test("downloads automatic airdrops csv with the response filename", async () => {
  const user = userEvent.setup();
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);
  mockGetStagingAuth.mockReturnValue("staging-token");
  mockGetAuthJwt.mockReturnValue("wallet-token");

  jest
    .spyOn(require("@/services/api/common-api"), "commonApiFetch")
    .mockResolvedValue({
      photos_count: 0,
      is_normalized: false,
      automatic_airdrops_addresses: 2,
      automatic_airdrops_count: 15,
    });

  render(<TestWrapper initialTokenId="123" />);

  const downloadButton = await screen.findByRole("button", {
    name: /download automatic airdrops csv/i,
  });

  await waitFor(() => expect(downloadButton).toBeEnabled());
  await user.click(downloadButton);

  await waitFor(() => {
    expect(mockUseDownloader).toHaveBeenCalledWith();
    expect(mockDownload).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/distributions/0x33FD426905F149f8376e227d0C9D3340AaD17aF1/123/automatic_airdrops",
      "automatic_airdrops_123.csv",
      undefined,
      {
        headers: {
          "x-6529-auth": "staging-token",
          Authorization: "Bearer wallet-token",
        },
      }
    );
  });
});

test("shows an admin-facing error when the downloader reports one", async () => {
  (isSubscriptionsAdmin as jest.Mock).mockReturnValue(true);

  jest
    .spyOn(require("@/services/api/common-api"), "commonApiFetch")
    .mockResolvedValue({
      photos_count: 0,
      is_normalized: false,
      automatic_airdrops_addresses: 1,
      automatic_airdrops_count: 5,
    });

  mockUseDownloader.mockReturnValue({
    download: mockDownload,
    isInProgress: false,
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
