import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProfileNicActivityLogs from "@/components/profile-activity/ProfileNicActivityLogs";
import { commonApiFetch } from "@/services/api/common-api";
import type { ActivityLogParamsConverted } from "@/components/profile-activity/ProfileActivityLogs";

let viewer = "owner";
let walletAuth = true;
let fetchingProfile = false;
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: { id: viewer },
    activeProfileProxy: null,
    fetchingProfile,
    isAuthenticated: Boolean(viewer) && walletAuth,
  }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: viewer || undefined,
    hasValidWalletAuth: Boolean(viewer) && walletAuth,
  }),
}));
jest.mock("@/components/react-query-wrapper/ReactQueryWrapper", () => ({
  QueryKey: { PROFILE_LOGS: "profile-logs" },
}));
jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock(
  "@/components/profile-activity/ProfileActivityLogsSkeleton",
  () => () => <div>Loading</div>
);
jest.mock(
  "@/components/profile-activity/ProfileActivityLogsResults",
  () =>
    (props: {
      logs?: { data: { id: string }[]; next: boolean };
      currentPage: number;
      setCurrentPage: (page: number) => void;
      loading: boolean;
    }) => (
      <div>
        {props.logs?.data.map((log) => (
          <div key={log.id}>{log.id}</div>
        ))}
        <span>Page {props.currentPage}</span>
        {props.currentPage > 1 && (
          <button
            disabled={props.loading}
            onClick={() => props.setCurrentPage(props.currentPage - 1)}
          >
            Previous
          </button>
        )}
        {props.logs?.next && (
          <button
            disabled={props.loading}
            onClick={() => props.setCurrentPage(props.currentPage + 1)}
          >
            Next
          </button>
        )}
      </div>
    )
);

const fetchMock = jest.mocked(commonApiFetch);
const params = {
  page: "1",
  page_size: "1",
  log_type: "RATING_EDIT,HANDLE_EDIT",
  profile: "shelby",
  activity_scope: "NIC" as const,
};
const response = (page: number) => ({
  page,
  next: page < 3,
  next_cursor: page < 3 ? `cursor-${page + 1}` : null,
  data: [{ id: `identity-page-${page}` }],
});

describe("NIC cursor pagination", () => {
  beforeEach(() => {
    viewer = "owner";
    walletAuth = true;
    fetchingProfile = false;
    fetchMock.mockReset();
    fetchMock.mockImplementation(async ({ params: request }) =>
      response(Number((request as typeof params).page))
    );
  });
  function setup() {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const tree = (request: ActivityLogParamsConverted = params) => (
      <QueryClientProvider client={client}>
        <ProfileNicActivityLogs params={request} user="shelby" />
      </QueryClientProvider>
    );
    return { ...render(tree()), tree, client };
  }
  it("uses server cursors forward, cached pages backward, and never offset-requests a missing page", async () => {
    setup();
    await screen.findByText("identity-page-1");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("identity-page-2");
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          page: "2",
          cursor: "cursor-2",
          activity_scope: "NIC",
        }),
      })
    );
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    await screen.findByText("identity-page-1");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("identity-page-3");
    expect(
      screen.queryByRole("button", { name: "Next" })
    ).not.toBeInTheDocument();
  });
  it("resets cursor and page when the direction, log types, profile or viewer changes", async () => {
    const { rerender, tree } = setup();
    await screen.findByText("identity-page-1");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("identity-page-2");
    rerender(tree({ ...params, log_type: "HANDLE_EDIT" }));
    await screen.findByText("identity-page-1");
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        params: expect.not.objectContaining({ cursor: expect.anything() }),
      })
    );
    rerender(tree({ ...params, profile: "another-profile" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          page: "1",
          profile: "another-profile",
        }),
      })
    );
    rerender(tree({ ...params, profile: undefined, target: "shelby" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(5));
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        params: expect.not.objectContaining({ cursor: expect.anything() }),
      })
    );
    viewer = "visitor";
    rerender(tree());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(6));
    expect(screen.getByText("Page 1")).toBeInTheDocument();
    viewer = "";
    rerender(tree());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(7));
  });
  it("does not advance on a failed page and allows retrying the same cursor", async () => {
    setup();
    await screen.findByText("identity-page-1");
    fetchMock.mockRejectedValueOnce(new Error("temporary"));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Next" })).toBeEnabled()
    );
    expect(screen.getByText("Page 1")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("identity-page-2");
  });
  it("shows public activity for a connected unsigned wallet and waits only while its profile is loading", async () => {
    walletAuth = false;
    const { rerender, tree } = setup();
    await screen.findByText("identity-page-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    walletAuth = true;
    fetchingProfile = true;
    rerender(tree());
    expect(screen.getByText("Loading")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchingProfile = false;
    rerender(tree());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await screen.findByText("identity-page-1");
  });
  it.each([{ page: 7 }, { data: [] }])(
    "keeps the current page when a continuation violates the page contract: %j",
    async (invalid) => {
      fetchMock.mockResolvedValueOnce(response(1));
      fetchMock.mockResolvedValueOnce({ ...response(2), ...invalid });
      setup();
      await screen.findByText("identity-page-1");
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Next" })).toBeEnabled()
      );
      expect(screen.getByText("Page 1")).toBeInTheDocument();
      expect(screen.getByText("identity-page-1")).toBeInTheDocument();
    }
  );
  it("does not display a mixed legacy response when the cursor API is unavailable", async () => {
    fetchMock.mockResolvedValue({
      page: 1,
      next: false,
      data: [{ id: "rep-must-not-appear" }],
    });
    setup();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("rep-must-not-appear")).not.toBeInTheDocument();
  });
});
