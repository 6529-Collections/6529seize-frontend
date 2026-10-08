import { ApiMonitoringSentryOverviewStatusEnum } from "@/generated/models/ApiMonitoringSentryOverview";
import MonitoringPageClient from "@/app/tools/monitoring/page.client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import { fetchMonitoringSentryOverview } from "@/services/api/monitoring-api";
import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { t } from "@/i18n/messages";

const mockAuth = {
  connectedProfile: { id: "member" } as { id: string } | null,
  fetchingProfile: false,
  isAuthenticated: true,
  isDirectProfileSession: true,
  activeProfileProxy: null as { id: string } | null,
  requestAuth: jest.fn().mockResolvedValue({ success: true }),
  setToast: jest.fn(),
};
const mockConnect = {
  address: "member-wallet" as string | undefined,
  isWalletConnectionPending: false,
  seizeConnect: jest.fn(),
};
jest.mock("@/components/auth/Auth", () => ({ useAuth: () => mockAuth }));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => mockConnect,
}));
jest.mock("@/contexts/TitleContext", () => ({ useSetTitle: jest.fn() }));
jest.mock("@/services/api/monitoring-api", () => ({
  fetchMonitoringSentryOverview: jest.fn(),
}));
jest.mock("@/services/api/common-api", () => ({
  getStructuredApiErrorStatus: (error: { status?: number } | null) =>
    error?.status,
}));

let client: QueryClient;
function page() {
  return (
    <QueryClientProvider client={client}>
      <MonitoringPageClient />
    </QueryClientProvider>
  );
}

describe("monitoring entry access", () => {
  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    mockAuth.connectedProfile = { id: "member" };
    mockAuth.isAuthenticated = true;
    mockAuth.isDirectProfileSession = true;
    mockAuth.activeProfileProxy = null;
    mockAuth.fetchingProfile = false;
    mockConnect.address = "member-wallet";
    mockConnect.isWalletConnectionPending = false;
    jest.mocked(fetchMonitoringSentryOverview).mockReset().mockResolvedValue({
      status: ApiMonitoringSentryOverviewStatusEnum.NotConfigured,
      environment: "",
      period: "24h",
      projects: [],
    });
  });
  afterEach(() => client.clear());

  it("shows Sentry only after the backend grants access", async () => {
    render(page());
    expect(
      screen.queryByText("Sentry is not connected yet.")
    ).not.toBeInTheDocument();
    expect(
      await screen.findByText("Sentry is not connected yet.")
    ).toBeInTheDocument();
  });

  it("offers wallet connection when signed out without making a private request", () => {
    mockAuth.isAuthenticated = false;
    mockConnect.address = undefined;
    render(page());
    expect(
      screen.getByRole("heading", { name: "Sign in required" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Connect wallet" })
    ).toBeInTheDocument();
    expect(fetchMonitoringSentryOverview).not.toHaveBeenCalled();
  });

  it("shows restricted access for signed-in non-members", async () => {
    jest
      .mocked(fetchMonitoringSentryOverview)
      .mockRejectedValue({ status: 403 });
    render(page());
    expect(
      await screen.findByRole("heading", { name: "Access restricted" })
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Sentry is not connected yet.")
    ).not.toBeInTheDocument();
  });

  it("rejects proxies without querying as the proxied profile", () => {
    mockAuth.activeProfileProxy = { id: "member" };
    mockAuth.isDirectProfileSession = false;
    render(page());
    expect(
      screen.getByRole("heading", { name: "Access restricted" })
    ).toBeInTheDocument();
    expect(fetchMonitoringSentryOverview).not.toHaveBeenCalled();
  });

  it("removes the allowed area immediately when the wallet changes", async () => {
    const view = render(page());
    await screen.findByText("Sentry is not connected yet.");
    jest
      .mocked(fetchMonitoringSentryOverview)
      .mockRejectedValue({ status: 403 });
    mockConnect.address = "non-member-wallet";
    mockAuth.connectedProfile = { id: "non-member" };
    view.rerender(page());
    expect(
      screen.queryByText("Sentry is not connected yet.")
    ).not.toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Access restricted" })
    ).toBeInTheDocument();
  });

  it("does not retain a previous grant when revalidation fails", async () => {
    render(page());
    await screen.findByText("Sentry is not connected yet.");
    jest
      .mocked(fetchMonitoringSentryOverview)
      .mockRejectedValue({ status: 503 });
    await act(async () => {
      await client.invalidateQueries();
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to load monitoring."
    );
    expect(
      screen.queryByText("Sentry is not connected yet.")
    ).not.toBeInTheDocument();
  });

  it("shows sign-in after the backend rejects an expired session", async () => {
    jest
      .mocked(fetchMonitoringSentryOverview)
      .mockRejectedValue({ status: 401 });
    render(page());
    expect(
      await screen.findByRole("heading", { name: "Sign in required" })
    ).toBeInTheDocument();
  });

  it("shows scoped counts, UTC times and Sentry links for a collected snapshot", async () => {
    jest.mocked(fetchMonitoringSentryOverview).mockResolvedValue({
      status: ApiMonitoringSentryOverviewStatusEnum.Ready,
      environment: "production",
      period: "24h",
      fetched_at: "2026-10-08T10:00:00Z",
      projects: [
        {
          project: "web",
          new_issues: [],
          top_issues: [
            {
              id: "123",
              short_id: "WEB-123",
              project: "web",
              title: "TypeError: failed",
              occurrences: 1234,
              first_seen: "2026-10-07T12:00:00Z",
              last_seen: "2026-10-08T09:00:00Z",
              url: "https://sentry.io/organizations/team/issues/123/",
            },
          ],
          new_issues_has_more: false,
          top_issues_has_more: true,
        },
        {
          project: "seize-backend",
          new_issues: [],
          top_issues: [
            {
              id: "456",
              short_id: "SEIZE-BACKEND-Y6",
              project: "seize-backend",
              title: "Market refresh failed",
              occurrences: 1,
              first_seen: "2026-10-08T02:00:00Z",
              last_seen: "2026-10-08T02:00:00Z",
              url: "https://sentry.io/organizations/team/issues/456/",
            },
          ],
          new_issues_has_more: false,
          top_issues_has_more: false,
        },
      ],
    });
    render(page());
    expect(
      await screen.findByText("1,234 events in this window")
    ).toBeInTheDocument();
    expect(screen.getByText("Last 24 hours · production")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "web", exact: true })
    ).toHaveTextContent("TypeError: failed");
    expect(
      screen.getByRole("region", { name: "seize-backend", exact: true })
    ).toHaveTextContent("Market refresh failed");
    expect(screen.getByText("1 event in this window")).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", {
        name: "Most frequent unresolved errors",
        exact: true,
      })
    ).toHaveLength(2);
    expect(
      screen.getAllByText("No matching errors in this window.")[0]
    ).toBeInTheDocument();
    expect(
      screen.getByText("Showing the first five matching issues.")
    ).toBeInTheDocument();
    const link = screen.getByRole("link", {
      name: "Open TypeError: failed in Sentry (opens in a new tab)",
    });
    expect(link).toHaveAttribute(
      "href",
      "https://sentry.io/organizations/team/issues/123/"
    );
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText(/Snapshot collected/)).toHaveTextContent("UTC");
  });

  it("hides a previous snapshot after the backend revokes group membership", async () => {
    render(page());
    await screen.findByText("Sentry is not connected yet.");
    jest
      .mocked(fetchMonitoringSentryOverview)
      .mockRejectedValue({ status: 403 });
    await act(async () => {
      await client.invalidateQueries();
    });
    expect(
      await screen.findByRole("heading", { name: "Access restricted" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Sentry", exact: true })
    ).not.toBeInTheDocument();
  });

  it.each(SUPPORTED_LOCALES)(
    "keeps monitoring copy available in %s",
    (locale) => {
      expect(t(locale, "monitoring.sentry.notConfigured")).toBe(
        "Sentry is not connected yet."
      );
    }
  );
});
