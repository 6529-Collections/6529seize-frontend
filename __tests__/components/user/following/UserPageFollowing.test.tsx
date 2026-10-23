import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { AuthContext } from "@/components/auth/Auth";
import type { AuthContextType } from "@/components/auth/authTypes";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import UserPageFollowing from "@/components/user/following/UserPageFollowing";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { createWaveQueryHandlers } from "@/components/react-query-wrapper/ReactQueryWrapper.waveHandlers";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/components/auth/Auth", () => ({
  AuthContext: jest.requireActual("react").createContext({}),
}));
jest.mock("@/components/react-query-wrapper/ReactQueryWrapper", () => ({
  QueryKey: jest.requireActual("@/components/react-query-wrapper/query-keys")
    .QueryKey,
}));
jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => ({
  __esModule: true,
  default: ({
    children,
    title,
    isOpen,
    onClose,
  }: {
    children: ReactNode;
    title: string;
    isOpen: boolean;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));
jest.mock("@/components/utils/CommonIntersectionElement", () => () => null);
jest.mock("@/components/utils/followers/Follower", () => ({
  __esModule: true,
  default: ({
    follower,
  }: {
    follower: { identity: { id: string; handle: string } };
  }) => (
    <li>
      <a href={`/${follower.identity.handle}`}>{follower.identity.handle}</a>
    </li>
  ),
}));

const owner = { id: "owner", handle: "owner" } as ApiIdentity;
const auth = {
  connectedProfile: owner,
  isAuthenticated: true,
  isDirectProfileSession: true,
  activeProfileProxy: null,
};
const target = {
  id: "artist-id",
  handle: "artist",
  pfp: null,
  level: 3,
  primary_address: "0x123",
};
const response = { data: [{ target }], count: 105, page: 1, next: false };

function setup(
  initial: Partial<AuthContextType> = auth,
  initialProfileId: string | null = "owner"
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const view = (value: Partial<AuthContextType>, profileId: string | null) => (
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={value as AuthContextType}>
        <UserPageFollowing profileId={profileId} />
      </AuthContext.Provider>
    </QueryClientProvider>
  );
  const rendered = render(view(initial, initialProfileId));
  return {
    ...rendered,
    client,
    change: (value: Partial<AuthContextType>, profileId = "owner") =>
      rendered.rerender(view(value, profileId)),
  };
}

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(commonApiFetch<unknown>).mockResolvedValue(response);
});

it.each([
  { value: { ...auth, isAuthenticated: false }, id: "owner" },
  { value: { ...auth, connectedProfile: null }, id: "owner" },
  { value: auth, id: "someone-else" },
  { value: auth, id: null },
  { value: { ...auth, isDirectProfileSession: false }, id: "owner" },
  {
    value: { ...auth, activeProfileProxy: { id: "proxy" } as ApiProfileProxy },
    id: "owner",
  },
])(
  "does not mount or fetch private data for ineligible context %#",
  ({ value, id }) => {
    const { container } = setup(value, id);
    expect(container).toBeEmptyDOMElement();
    expect(commonApiFetch).not.toHaveBeenCalled();
  }
);

it("loads only the count until opening the list, then requests its first full page", async () => {
  setup();
  const button = await screen.findByRole("button", {
    name: "Open your following list: 105",
  });
  expect(button).toHaveTextContent("105 Following");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(commonApiFetch).toHaveBeenCalledTimes(1);
  expect(commonApiFetch).toHaveBeenLastCalledWith(
    expect.objectContaining({
      params: { page: "1", page_size: "1" },
    })
  );
  fireEvent.click(button);
  await screen.findByRole("link", { name: "artist" });
  expect(screen.getByRole("list", { name: "Following" })).toBeVisible();
  expect(screen.getByRole("link", { name: "artist" })).toHaveAttribute(
    "href",
    "/artist"
  );
  expect(commonApiFetch).toHaveBeenCalledTimes(2);
  expect(commonApiFetch).toHaveBeenLastCalledWith(
    expect.objectContaining({
      params: { page: "1", page_size: "100" },
    })
  );
});

it("loads the next page with the button when intersection loading is unavailable", async () => {
  jest
    .mocked(commonApiFetch<unknown>)
    .mockResolvedValueOnce({ ...response, count: 2, next: true })
    .mockResolvedValueOnce({ ...response, count: 2, next: true })
    .mockResolvedValueOnce({
      ...response,
      count: 2,
      page: 2,
      data: [{ target: { ...target, id: "second", handle: "second-artist" } }],
    });
  setup();
  fireEvent.click(
    await screen.findByRole("button", { name: "Open your following list: 2" })
  );
  fireEvent.click(await screen.findByRole("button", { name: "Load more" }));
  await screen.findByRole("link", { name: "second-artist" });
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(commonApiFetch).toHaveBeenLastCalledWith(
    expect.objectContaining({ params: { page: "2", page_size: "100" } })
  );
  expect(
    screen.queryByRole("button", { name: "Load more" })
  ).not.toBeInTheDocument();
});

it("shows loading without a fabricated zero", async () => {
  jest
    .mocked(commonApiFetch<unknown>)
    .mockImplementation(() => new Promise(() => {}));
  setup();
  fireEvent.click(
    screen.getByRole("button", { name: "Open your following list: …" })
  );
  expect(screen.getByRole("status")).toHaveTextContent(
    "Loading following list"
  );
  expect(
    screen.queryByText("You aren't following anyone yet.")
  ).not.toBeInTheDocument();
});

it("shows an error and retries instead of showing an empty list", async () => {
  jest.mocked(commonApiFetch<unknown>).mockRejectedValue(new Error("Offline"));
  setup();
  fireEvent.click(
    await screen.findByRole("button", {
      name: "Open your following list: Unavailable",
    })
  );
  expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load");
  expect(
    screen.queryByText("You aren't following anyone yet.")
  ).not.toBeInTheDocument();
  jest
    .mocked(commonApiFetch<unknown>)
    .mockResolvedValue({ ...response, data: [], count: 0 });
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await screen.findByText("You aren't following anyone yet.");
  expect(
    screen.getByRole("button", { name: "Open your following list: 0" })
  ).toBeInTheDocument();
});

it.each(["account", "signout", "proxy", "token-role", "route"])(
  "closes an open list immediately on %s change",
  async (transition) => {
    const { change } = setup();
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Open your following list: 105",
      })
    );
    let next: Partial<AuthContextType> = auth;
    let profileId = "owner";
    if (transition === "account")
      next = { ...auth, connectedProfile: { ...owner, id: "other" } };
    if (transition === "signout") next = { ...auth, isAuthenticated: false };
    if (transition === "proxy")
      next = {
        ...auth,
        activeProfileProxy: { id: "proxy" } as ApiProfileProxy,
      };
    if (transition === "token-role")
      next = { ...auth, isDirectProfileSession: false };
    if (transition === "route") profileId = "other";
    act(() => change(next, profileId));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Open your following/ })
    ).not.toBeInTheDocument();
    await waitFor(() => expect(commonApiFetch).toHaveBeenCalledTimes(2));
  }
);

it("reuses a fresh list on reopen without fetching another full page", async () => {
  setup();
  const opener = await screen.findByRole("button", {
    name: "Open your following list: 105",
  });
  fireEvent.click(opener);
  await screen.findByRole("link", { name: "artist" });
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  fireEvent.click(opener);
  expect(screen.getByRole("link", { name: "artist" })).toBeVisible();
  expect(commonApiFetch).toHaveBeenCalledTimes(2);
});

it("refreshes the count after mutations while fetching list pages only when open", async () => {
  let targets = [target, { ...target, id: "second", handle: "second" }];
  jest
    .mocked(commonApiFetch<unknown>)
    .mockImplementation(async ({ params }) => {
      const size = Number(params?.["page_size"]);
      return {
        data: targets.slice(0, size).map((entry) => ({ target: entry })),
        count: targets.length,
        page: 1,
        next: targets.length > size,
      };
    });
  const { client } = setup();
  await screen.findByRole("button", { name: "Open your following list: 2" });
  targets = [...targets, { ...target, id: "third", handle: "third" }];
  act(() => createWaveQueryHandlers(client).onIdentityFollowChange());
  const opener = await screen.findByRole("button", {
    name: "Open your following list: 3",
  });
  expect(
    jest
      .mocked(commonApiFetch<unknown>)
      .mock.calls.map(([args]) => args.params?.["page_size"])
  ).toEqual(["1", "1"]);
  fireEvent.click(opener);
  await screen.findByRole("link", { name: "third" });
  targets = targets.slice(1);
  act(() => createWaveQueryHandlers(client).onIdentityFollowChange());
  await screen.findByRole("button", { name: "Open your following list: 2" });
  await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(2));
  expect(
    screen.queryByRole("link", { name: "artist" })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  jest.mocked(commonApiFetch<unknown>).mockClear();
  targets = targets.slice(1);
  act(() => createWaveQueryHandlers(client).onIdentityFollowChange());
  fireEvent.click(
    await screen.findByRole("button", { name: "Open your following list: 1" })
  );
  await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(1));
  expect(
    jest
      .mocked(commonApiFetch<unknown>)
      .mock.calls.map(([args]) => args.params?.["page_size"])
  ).toEqual(["1", "100"]);
  expect(screen.getByRole("link", { name: "third" })).toBeVisible();
});

it("does not mistake a successful zero count for a successful list request", async () => {
  jest
    .mocked(commonApiFetch<unknown>)
    .mockImplementation(async ({ params }) => {
      if (params?.["page_size"] === "100") throw new Error("List unavailable");
      return { ...response, data: [], count: 0 };
    });
  setup();
  fireEvent.click(
    await screen.findByRole("button", { name: "Open your following list: 0" })
  );
  await screen.findByRole("alert");
  expect(
    screen.queryByText("You aren't following anyone yet.")
  ).not.toBeInTheDocument();
  jest
    .mocked(commonApiFetch<unknown>)
    .mockResolvedValue({ ...response, data: [], count: 0 });
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await screen.findByText("You aren't following anyone yet.");
});

it("cancels both private requests on account change and ignores their late responses", async () => {
  const pending: ((value: unknown) => void)[] = [];
  jest
    .mocked(commonApiFetch<unknown>)
    .mockImplementation(() => new Promise((resolve) => pending.push(resolve)));
  const { change, client, unmount } = setup();
  fireEvent.click(
    screen.getByRole("button", { name: "Open your following list: …" })
  );
  const oldSignals = jest
    .mocked(commonApiFetch<unknown>)
    .mock.calls.map(([args]) => args.signal);
  expect(oldSignals).toHaveLength(2);
  change({ ...auth, connectedProfile: { ...owner, id: "other" } }, "other");
  expect(oldSignals.every((signal) => signal?.aborted)).toBe(true);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  await act(async () => {
    pending[0]?.(response);
    pending[1]?.(response);
  });
  expect(
    screen.getByRole("button", { name: "Open your following list: …" })
  ).toBeVisible();
  await waitFor(() =>
    expect(
      client.getQueriesData({
        queryKey: [QueryKey.IDENTITY_FOLLOWING, "owner"],
      })
    ).toEqual([])
  );
  await act(async () => {
    pending[2]?.({ ...response, count: 7 });
  });
  await screen.findByRole("button", { name: "Open your following list: 7" });
  expect(commonApiFetch).toHaveBeenCalledTimes(3);
  unmount();
  await waitFor(() => expect(client.getQueryCache().getAll()).toHaveLength(0));
});
