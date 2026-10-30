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
let mockAddress: string | undefined = "0xviewer";
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: mockAddress,
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
    <>
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
    </>
  ),
}));
const fetchPreference = jest.mocked(commonApiFetch);
const postPreference = jest.mocked(commonApiPost);
const deletePreference = jest.mocked(commonApiDelete);
const name = /^Artwork alerts/;

function setup(overrides: Partial<AuthContextType> = {}, blocked = false) {
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
  const view = (value: AuthContextType) => (
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={value}>
        <ProfileBlockActionMenu
          handle="artist"
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
    rerenderAuth: (next: Partial<AuthContextType>) =>
      rendered.rerender(view({ ...auth, ...next })),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAddress = "0xviewer";
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
  expect(button).toHaveTextContent(
    "Notify me when this artist submits new artwork to The Memes – Main Stage."
  );
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

it("opens authentication for guests without opting them in", async () => {
  mockAddress = undefined;
  setup({
    connectedProfile: null,
    isAuthenticated: false,
    isDirectProfileSession: false,
  });
  await userEvent.click(screen.getByRole("button", { name }));
  expect(mockConnect).toHaveBeenCalledTimes(1);
  expect(fetchPreference).not.toHaveBeenCalled();
  expect(postPreference).not.toHaveBeenCalled();
});

it("lets users retry a failed initial read before changing the preference", async () => {
  fetchPreference
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValue({ enabled: true });
  setup();
  await userEvent.click(
    await screen.findByRole("button", { name: /^Retry artwork alerts/ })
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
    name: /^Retry artwork alerts/,
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
