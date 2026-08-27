import ReportsPreferencesSettings from "@/components/preferences/ReportsPreferencesSettings";
import { ApiContentModerationReportReason } from "@/generated/models/ApiContentModerationReportReason";
import { ApiContentModerationReportStatus } from "@/generated/models/ApiContentModerationReportStatus";
import { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";
import type { ApiContentModerationUserReport } from "@/generated/models/ApiContentModerationUserReport";
import {
  fetchMyContentModerationReports,
  withdrawDropReport,
} from "@/services/api/content-moderation-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    requestAuth: jest.fn().mockResolvedValue({ success: true }),
    setToast: jest.fn(),
  }),
}));
jest.mock("@/services/api/content-moderation-api", () => ({
  fetchMyContentModerationReports: jest.fn(),
  withdrawDropReport: jest.fn(),
}));
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} />
  ),
}));

const report = (
  overrides: Partial<ApiContentModerationUserReport> = {}
): ApiContentModerationUserReport => ({
  id: "report-1",
  drop_id: "drop-1",
  author_profile_id: "author-1",
  author_handle: "alice",
  author_pfp: null,
  reason: ApiContentModerationReportReason.ScamOrPhishing,
  notes: null,
  status: ApiContentModerationReportStatus.Open,
  created_at: Date.UTC(2026, 7, 27, 8, 42),
  resolved_at: null,
  drop_status: ApiDropModerationStatus.Visible,
  cursor: "cursor-1",
  ...overrides,
});

const renderSettings = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { readonly children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<ReportsPreferencesSettings />, { wrapper: Wrapper });
};

describe("ReportsPreferencesSettings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(withdrawDropReport).mockResolvedValue({
      drop_id: "drop-1",
      status: ApiContentModerationReportStatus.Withdrawn,
      drop_status: ApiDropModerationStatus.Visible,
    });
  });

  it("lists only the reporter-facing status and final decision", async () => {
    jest.mocked(fetchMyContentModerationReports).mockResolvedValue([
      report(),
      report({
        id: "report-2",
        drop_id: "drop-2",
        status: ApiContentModerationReportStatus.ResolvedRemoved,
        cursor: "cursor-2",
      }),
    ]);

    renderSettings();

    expect((await screen.findAllByText("@alice"))[0]).toHaveAttribute(
      "href",
      "/alice"
    );
    expect(screen.getByText("Reported · Awaiting review")).toBeVisible();
    expect(screen.getByText("Reviewed · Content removed")).toBeVisible();
    expect(screen.queryByText(/AI assessment/i)).not.toBeInTheDocument();
  });

  it("allows an open report to be withdrawn", async () => {
    jest.mocked(fetchMyContentModerationReports).mockResolvedValue([report()]);
    renderSettings();

    fireEvent.click(
      await screen.findByRole("button", { name: "Withdraw report" })
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(
      screen.getAllByRole("button", { name: "Withdraw report" }).at(-1)!
    );

    await waitFor(() =>
      expect(withdrawDropReport).toHaveBeenCalledWith("drop-1")
    );
  });
});
