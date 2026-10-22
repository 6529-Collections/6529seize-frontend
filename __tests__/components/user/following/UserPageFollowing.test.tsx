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
    change: (value: Partial<AuthContextType>, profileId = "owner") =>
      rendered.rerender(view(value, profileId)),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(commonApiFetch).mockResolvedValue(response);
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

it("shows API total beside the Following label and opens the list", async () => {
  setup();
  const button = await screen.findByRole("button", {
    name: "Open your following list: 105",
  });
  expect(button).toHaveTextContent("105 Following");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  fireEvent.click(button);
  expect(screen.getByRole("list", { name: "Following" })).toBeVisible();
  expect(screen.getByRole("link", { name: "artist" })).toHaveAttribute(
    "href",
    "/artist"
  );
  expect(commonApiFetch).toHaveBeenCalledTimes(1);
});

it("shows loading without a fabricated zero", async () => {
  jest.mocked(commonApiFetch).mockImplementation(() => new Promise(() => {}));
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
  jest
    .mocked(commonApiFetch)
    .mockRejectedValueOnce(new Error("Offline"))
    .mockResolvedValueOnce({ ...response, data: [], count: 0 });
  setup();
  fireEvent.click(
    await screen.findByRole("button", {
      name: "Open your following list: Unavailable",
    })
  );
  expect(screen.getByRole("alert")).toHaveTextContent("Couldn't load");
  expect(
    screen.queryByText("You aren't following anyone yet.")
  ).not.toBeInTheDocument();
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
    await waitFor(() => expect(commonApiFetch).toHaveBeenCalledTimes(1));
  }
);
