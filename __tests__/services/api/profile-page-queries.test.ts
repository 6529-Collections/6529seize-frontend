import {
  dehydrate,
  hydrate,
  QueryClient,
  QueryObserver,
  CancelledError,
} from "@tanstack/react-query";
import { commonApiFetch } from "@/services/api/common-api";
import {
  repCategoriesQueryOptions,
  repOverviewQueryOptions,
} from "@/services/api/profile-page-queries";
import { getAuthJwt } from "@/services/auth/auth.utils";
import { profileQueryViewer } from "@/services/auth/profile-query-viewer";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/services/auth/auth.utils", () => ({ getAuthJwt: jest.fn() }));

const fetchApi = jest.mocked(commonApiFetch);
const walletToken = jest.mocked(getAuthJwt);

beforeEach(() => {
  jest.clearAllMocks();
  walletToken.mockReturnValue(null);
});

it("uses a pending server page as the first infinite-query page", async () => {
  let completeRequest: (value: unknown) => void = () => undefined;
  fetchApi.mockReturnValueOnce(
    new Promise((resolve) => {
      completeRequest = resolve;
    })
  );
  const server = new QueryClient();
  const browser = new QueryClient();
  const browserQuery = repCategoriesQueryOptions("profile", "incoming", null);

  void server.prefetchInfiniteQuery(
    repCategoriesQueryOptions("profile", "incoming", null, {})
  );
  hydrate(browser, dehydrate(server, { shouldDehydrateQuery: () => true }));
  const page = browser.fetchInfiniteQuery(browserQuery);
  const response = { page: 1, data: [], next: true };
  completeRequest(response);

  await expect(page).resolves.toEqual({ pages: [response], pageParams: [1] });
  expect(fetchApi).toHaveBeenCalledTimes(1);
  expect(fetchApi).toHaveBeenCalledWith(
    expect.objectContaining({
      endpoint: "profiles/profile/rep/categories",
      params: { page: "1", page_size: "25", top_contributors_limit: "5" },
      cache: "no-store",
    })
  );
});

it("does not use a pending server snapshot for a different browser viewer", async () => {
  const server = new QueryClient();
  const browser = new QueryClient({
    defaultOptions: { queries: { staleTime: 10000 } },
  });
  const proxyToken = "proxy-session-token";
  const proxyViewer = profileQueryViewer(proxyToken);
  const directToken = "direct-session-token";
  const directViewer = profileQueryViewer(directToken);
  let completeProxyRequest: (value: unknown) => void = () => undefined;
  const proxyResponse = { authenticated_user_contribution: 45 };
  const directResponse = { authenticated_user_contribution: 7 };
  fetchApi
    .mockReturnValueOnce(
      new Promise((resolve) => {
        completeProxyRequest = resolve;
      })
    )
    .mockResolvedValueOnce(directResponse);
  void server.prefetchQuery(
    repOverviewQueryOptions("profile", "incoming", proxyViewer, {
      Authorization: `Bearer ${proxyToken}`,
    })
  );
  const snapshot = dehydrate(server, { shouldDehydrateQuery: () => true });
  expect(JSON.stringify(snapshot)).not.toContain(proxyToken);
  hydrate(browser, snapshot);

  walletToken.mockReturnValue(directToken);
  const directQuery = repOverviewQueryOptions(
    "profile",
    "incoming",
    directViewer
  );
  await expect(browser.fetchQuery(directQuery)).resolves.toEqual(
    directResponse
  );

  const proxyQuery = repOverviewQueryOptions(
    "profile",
    "incoming",
    proxyViewer
  );
  expect(browser.getQueryState(proxyQuery.queryKey)?.fetchStatus).toBe(
    "fetching"
  );
  completeProxyRequest(proxyResponse);
  walletToken.mockReturnValue(proxyToken);
  await expect(browser.fetchQuery(proxyQuery)).resolves.toEqual(proxyResponse);
  expect(browser.getQueryData(directQuery.queryKey)).toEqual(directResponse);
  expect(fetchApi).toHaveBeenCalledTimes(2);
});

it("rejects a scheduled read if the session has changed before it starts", () => {
  const query = repOverviewQueryOptions("profile", "incoming", null);
  walletToken.mockReturnValue("new-session-token");

  expect(query.queryFn).toThrow(CancelledError);
  expect(fetchApi).not.toHaveBeenCalled();
});

it("retries a failed server snapshot with the normal browser query", async () => {
  let failRequest: (error: Error) => void = () => undefined;
  fetchApi.mockReturnValueOnce(
    new Promise((_resolve, reject) => {
      failRequest = reject;
    })
  );
  const response = { total_rep: 8 };
  fetchApi.mockResolvedValueOnce(response);
  const server = new QueryClient();
  const browser = new QueryClient({
    defaultOptions: { queries: { retry: 1, retryDelay: 0 } },
  });
  void server.prefetchQuery(
    repOverviewQueryOptions("profile", "incoming", null, {})
  );
  hydrate(
    browser,
    dehydrate(server, {
      shouldDehydrateQuery: () => true,
      shouldRedactErrors: () => false,
    })
  );
  const browserQuery = repOverviewQueryOptions("profile", "incoming", null);
  const observer = new QueryObserver(browser, browserQuery);
  const unsubscribe = observer.subscribe(() => undefined);
  try {
    const result = browser.fetchQuery(browserQuery);
    failRequest(new Error("Server request failed"));

    await expect(result).resolves.toEqual(response);
    expect(fetchApi).toHaveBeenCalledTimes(2);
  } finally {
    unsubscribe();
  }
});
