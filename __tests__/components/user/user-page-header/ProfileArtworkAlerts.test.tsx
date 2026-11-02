import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext, type AuthContextType } from "@/components/auth/Auth";
import ProfileBlockActionMenu from "@/components/user/user-page-header/ProfileBlockActionMenu";
import type { CompactMenuItem } from "@/components/compact-menu";
import {
  commonApiFetch,
  commonApiPost,
  commonApiDelete,
} from "@/services/api/common-api";

const mockConnect = jest.fn();
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: "0xviewer",
    seizeConnect: mockConnect,
  }),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
  commonApiDelete: jest.fn(),
}));
jest.mock("@/services/auth/auth.utils", () => ({
  getWalletAddress: () => "0xviewer",
  getAuthJwt: () => "test-jwt",
}));
jest.mock("@/hooks/useProfileMute", () => () => ({
  isMuted: false,
  isPending: false,
  toggleMute: jest.fn(),
}));
jest.mock("@/hooks/useIsMobileLayoutViewport", () => () => false);
jest.mock("@/components/compact-menu", () => ({
  CompactMenu: ({ items }: { items: readonly CompactMenuItem[] }) => (
    <div data-testid="profile-actions">
      {items.map(
        (item) =>
          item.kind !== "section" && (
            <button
              key={item.id}
              disabled={item.disabled}
              onClick={item.onSelect}
            >
              {item.label}
            </button>
          )
      )}
    </div>
  ),
}));
const fetchPreference = jest.mocked(commonApiFetch);
const postPreference = jest.mocked(commonApiPost);
const deletePreference = jest.mocked(commonApiDelete);
const name = /^Artwork alerts/;

function setup(
  overrides: Partial<AuthContextType> = {},
  blocked = false,
  hasArtistActivity = true
) {
  const requestAuth = jest.fn().mockResolvedValue({ success: true });
  const setToast = jest.fn();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const auth = {
    connectedProfile: { id: "viewer", handle: "viewer" },
    isAuthenticated: true,
    isDirectProfileSession: true,
    activeProfileProxy: null,
    requestAuth,
    setToast,
    ...overrides,
  } as AuthContextType;
  const view = (value: AuthContextType, activity = hasArtistActivity) => (
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={value}>
        <ProfileBlockActionMenu
          handle="artist"
          hasArtistActivity={activity}
          blocked={blocked}
          disabled={false}
          onBlock={() => undefined}
          showPersonalActions={false}
        />
      </AuthContext.Provider>
    </QueryClientProvider>
  );
  const rendered = render(view(auth));
  return {
    requestAuth,
    setToast,
    client,
    rerenderArtistActivity: (activity: boolean) =>
      rendered.rerender(view(auth, activity)),
    rerenderAuth: (next: Partial<AuthContextType>) =>
      rendered.rerender(view({ ...auth, ...next })),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  fetchPreference.mockResolvedValue({ enabled: false });
  postPreference.mockResolvedValue({ enabled: true });
  deletePreference.mockResolvedValue(undefined);
});

it("toggles the saved preference without changing feed subscriptions", async () => {
  const user = userEvent.setup();
  setup();
  const button = screen.getByRole("button", { name });
  await waitFor(() => expect(button).toBeEnabled());
  expect(button).toHaveTextContent("Off");
  expect(button).toHaveTextContent("New Main Stage artwork.");
  await user.click(button);
  await waitFor(() => expect(button).toHaveTextContent("On"));
  expect(postPreference).toHaveBeenCalledTimes(1);
  expect(postPreference).toHaveBeenCalledWith({
    endpoint: "identities/artist/artwork-alerts",
    body: undefined,
  });
  await user.click(button);
  await waitFor(() => expect(button).toHaveTextContent("Off"));
  expect(deletePreference).toHaveBeenCalledTimes(1);
  expect(deletePreference).toHaveBeenCalledWith({
    endpoint: "identities/artist/artwork-alerts",
  });
});

it("hides artwork alerts from signed-out viewers, including artist profiles", () => {
  setup({
    connectedProfile: null,
    isAuthenticated: false,
    isDirectProfileSession: false,
  });
  expect(screen.queryByTestId("profile-actions")).not.toBeInTheDocument();
  expect(mockConnect).not.toHaveBeenCalled();
  expect(fetchPreference).not.toHaveBeenCalled();
  expect(postPreference).not.toHaveBeenCalled();
});

it("lets users retry a failed initial read before changing the preference", async () => {
  fetchPreference
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValue({ enabled: true });
  setup();
  await userEvent.click(
    await screen.findByRole("button", { name: /^Artwork alerts.*Try again/ })
  );
  await waitFor(() =>
    expect(screen.getByRole("button", { name })).toHaveTextContent("On")
  );
  expect(postPreference).not.toHaveBeenCalled();
  expect(deletePreference).not.toHaveBeenCalled();
});

it("reads back uncertain writes and reports an actionable error", async () => {
  postPreference.mockRejectedValueOnce(new Error("lost response"));
  const { setToast } = setup();
  const button = screen.getByRole("button", { name });
  await waitFor(() => expect(button).toBeEnabled());
  fetchPreference.mockResolvedValue({ enabled: true });
  await userEvent.click(button);
  await waitFor(() => expect(button).toHaveTextContent("On"));
  expect(fetchPreference).toHaveBeenCalledTimes(2);
  expect(setToast).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "error",
      title: "Couldn’t save artwork alerts.",
    })
  );
});

it("cancels pending authentication when the viewer switches profiles", async () => {
  let finishAuth!: (result: { success: boolean }) => void;
  const requestAuth = jest.fn(
    () =>
      new Promise<{ success: boolean }>((resolve) => {
        finishAuth = resolve;
      })
  );
  const { rerenderAuth } = setup({ requestAuth });
  await waitFor(() =>
    expect(screen.getByRole("button", { name })).toBeEnabled()
  );
  await userEvent.click(screen.getByRole("button", { name }));
  rerenderAuth({
    connectedProfile: {
      id: "other",
      handle: "other",
    } as AuthContextType["connectedProfile"],
  });
  await act(async () => finishAuth({ success: true }));
  expect(postPreference).not.toHaveBeenCalled();
  await waitFor(() =>
    expect(screen.getByRole("button", { name })).toHaveTextContent("Off")
  );
});

it("disables proxy management without reading a different profile’s preference", () => {
  setup({
    activeProfileProxy: {
      id: "proxy",
    } as AuthContextType["activeProfileProxy"],
    isDirectProfileSession: false,
  });
  expect(screen.getByRole("button", { name })).toBeDisabled();
  expect(fetchPreference).not.toHaveBeenCalled();
});

it("permits turning existing alerts off for a blocked artist", async () => {
  fetchPreference.mockResolvedValue({ enabled: true });
  setup({}, true);
  await waitFor(() =>
    expect(screen.getByRole("button", { name })).toBeEnabled()
  );
  await userEvent.click(screen.getByRole("button", { name }));
  await waitFor(() => expect(deletePreference).toHaveBeenCalledTimes(1));
  expect(screen.getByRole("button", { name })).toBeDisabled();
});

it("can retry an unknown saved preference for a blocked artist", async () => {
  fetchPreference
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValue({ enabled: true });
  setup({}, true);
  const retry = await screen.findByRole("button", {
    name: /^Artwork alerts.*Try again/,
  });
  expect(retry).not.toHaveTextContent("Off");
  await userEvent.click(retry);
  await waitFor(() =>
    expect(screen.getByRole("button", { name })).toHaveTextContent("On")
  );
  expect(screen.getByRole("button", { name })).toBeEnabled();
});

it("loads the viewer preference after a guest signs in, without implicit opt-in", async () => {
  const { rerenderAuth } = setup({
    connectedProfile: null,
    isAuthenticated: false,
    isDirectProfileSession: false,
  });
  expect(fetchPreference).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
  rerenderAuth({
    connectedProfile: {
      id: "viewer",
      handle: "viewer",
    } as AuthContextType["connectedProfile"],
    isAuthenticated: true,
    isDirectProfileSession: true,
  });
  await waitFor(() =>
    expect(screen.getByRole("button", { name })).toBeEnabled()
  );
  expect(fetchPreference).toHaveBeenCalledTimes(1);
  expect(postPreference).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole("button", { name }));
  await waitFor(() => expect(postPreference).toHaveBeenCalledTimes(1));
});

it("hides alerts without artist activity but still checks for an enabled preference", async () => {
  const { client } = setup({}, false, false);
  await waitFor(() => expect(client.isFetching()).toBe(0));
  expect(fetchPreference).toHaveBeenCalledWith(
    expect.objectContaining({ endpoint: "identities/artist/artwork-alerts" })
  );
  expect(screen.queryByTestId("profile-actions")).not.toBeInTheDocument();
});

it("keeps existing alerts available without artist activity until turned off", async () => {
  fetchPreference.mockResolvedValue({ enabled: true });
  setup({}, false, false);
  const button = await screen.findByRole("button", { name });
  expect(button).toHaveTextContent("On");
  await userEvent.click(button);
  await waitFor(() =>
    expect(screen.queryByTestId("profile-actions")).not.toBeInTheDocument()
  );
  expect(deletePreference).toHaveBeenCalledTimes(1);
  expect(postPreference).not.toHaveBeenCalled();
});

it("keeps enabled alerts when artist activity disappears", async () => {
  fetchPreference.mockResolvedValue({ enabled: true });
  const { rerenderArtistActivity } = setup();
  await waitFor(() =>
    expect(screen.getByRole("button", { name })).toHaveTextContent("On")
  );
  rerenderArtistActivity(false);
  expect(screen.getByRole("button", { name })).toBeEnabled();
  expect(screen.getByRole("button", { name })).toHaveTextContent("On");
});

it("keeps retry available after a failed refresh of enabled alerts without activity", async () => {
  fetchPreference.mockResolvedValueOnce({ enabled: true });
  const { client } = setup({}, false, false);
  await screen.findByRole("button", { name });
  fetchPreference.mockRejectedValueOnce(new Error("offline"));
  await act(async () => {
    await client.invalidateQueries();
  });
  const retry = await screen.findByRole("button", {
    name: /^Artwork alerts.*Try again/,
  });
  expect(retry).toBeEnabled();
  expect(retry).not.toHaveTextContent("Off");
  fetchPreference.mockResolvedValue({ enabled: true });
  await userEvent.click(retry);
  await waitFor(() =>
    expect(screen.getByRole("button", { name })).toHaveTextContent("On")
  );
});

it("omits an empty actions menu for guests viewing profiles without artist activity", () => {
  setup({ connectedProfile: null, isAuthenticated: false }, false, false);
  expect(screen.queryByTestId("profile-actions")).not.toBeInTheDocument();
  expect(fetchPreference).not.toHaveBeenCalled();
});

it("hides saved alerts after authentication ends, even with a remembered profile", async () => {
  fetchPreference.mockResolvedValue({ enabled: true });
  const { rerenderAuth } = setup();
  await waitFor(() =>
    expect(screen.getByRole("button", { name })).toHaveTextContent("On")
  );
  rerenderAuth({ isAuthenticated: false, isDirectProfileSession: false });
  expect(screen.queryByTestId("profile-actions")).not.toBeInTheDocument();
  expect(fetchPreference).toHaveBeenCalledTimes(1);
  expect(postPreference).not.toHaveBeenCalled();
  expect(deletePreference).not.toHaveBeenCalled();
});
