import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import RepCategoryDetails from "@/components/user/rep/RepCategoryDetails";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiRepCategory } from "@/generated/models/ApiRepCategory";
import { useRepAllocation } from "@/hooks/useRepAllocation";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useContext, type ReactNode } from "react";

jest.mock("@/hooks/useRepAllocation");
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
}));
const allocation = jest.mocked(useRepAllocation);
const fetchApi = jest.mocked(commonApiFetch);
const post = jest.mocked(commonApiPost);
const owner = {
  id: "owner-id",
  query: "owner",
  handle: "owner",
  pfp: null,
  wallets: [],
} as unknown as ApiIdentity;
const target = { ...owner, id: "target-id", query: "target", handle: "target" };
const category: ApiRepCategory = {
  category: "Artist",
  total_rep: 50,
  contributor_count: 2,
  authenticated_user_contribution: null,
  top_contributors: [],
};
const requestAuth = jest.fn();
const onProfileRepModify = jest.fn();
let rows: {
  profile: { id: string; handle: string; primary_address: string; pfp: null };
  contribution: number;
}[];

function setup(
  profile: ApiIdentity,
  direction: "received" | "given",
  viewer: ApiIdentity | null = owner
) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  function Wrapper({ children }: { readonly children: ReactNode }) {
    const auth = useContext(AuthContext);
    const queries = useContext(ReactQueryWrapperContext);
    return (
      <QueryClientProvider client={client}>
        <AuthContext
          value={{
            ...auth,
            connectedProfile: viewer,
            activeProfileProxy: null,
            requestAuth,
            setToast: jest.fn(),
          }}
        >
          <ReactQueryWrapperContext value={{ ...queries, onProfileRepModify }}>
            {children}
          </ReactQueryWrapperContext>
        </AuthContext>
      </QueryClientProvider>
    );
  }
  render(
    <RepCategoryDetails
      profile={profile}
      category={category}
      direction={direction}
      focusInput={0}
      onOpenGlobalCategory={jest.fn()}
      onBusyChange={jest.fn()}
    />,
    { wrapper: Wrapper }
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  rows = [
    {
      profile: {
        id: "alice-id",
        handle: "alice",
        primary_address: "0x1",
        pfp: null,
      },
      contribution: 30,
    },
    {
      profile: {
        id: "bob-id",
        handle: "bob",
        primary_address: "0x2",
        pfp: null,
      },
      contribution: 20,
    },
  ];
  requestAuth.mockResolvedValue({ success: true });
  allocation.mockReturnValue({
    repState: {
      category: "Artist",
      rater_contribution: 0,
      rating: 50,
      contributor_count: 2,
    },
    heroAvailableRep: 80,
    proxyAvailableCredit: null,
    minMaxValues: { min: -80, max: 80 },
    isError: false,
    isFetching: false,
    retry: jest.fn(),
  });
  fetchApi.mockImplementation(async ({ endpoint }) => {
    if (endpoint.startsWith("identities/")) {
      const handle = endpoint.slice("identities/".length);
      return { ...target, id: `${handle}-id`, handle, query: handle };
    }
    return { data: rows.map((row) => ({ ...row })), page: 1, next: false };
  });
  post.mockImplementation(async ({ endpoint, body }) => {
    const handle = endpoint.split("/")[1];
    const change = body as { amount: number };
    rows = rows.map((row) =>
      row.profile.handle === handle
        ? { ...row, contribution: change.amount }
        : row
    );
    return undefined;
  });
});

it("pins only your editable contribution, accepts negative values, and saves the desired total", async () => {
  const user = userEvent.setup();
  setup(target, "received");
  const amount = await screen.findByRole("textbox", { name: "REP for owner" });
  await waitFor(() => expect(amount).toHaveValue("0"));
  expect(screen.getAllByRole("textbox")).toHaveLength(1);
  expect(screen.getByRole("link", { name: "You" })).toHaveAttribute(
    "href",
    "/owner"
  );
  await user.type(amount, "-15");
  expect(amount).toHaveClass("tw-text-rose-400");
  await user.click(screen.getByRole("button", { name: "Save", exact: true }));
  await waitFor(() =>
    expect(post).toHaveBeenCalledWith({
      endpoint: "profiles/target/rep/rating",
      body: { amount: -15, category: "Artist" },
    })
  );
  expect(onProfileRepModify).toHaveBeenCalledWith(
    expect.objectContaining({ targetProfile: target })
  );
});

it("makes the owner's received categories read-only", async () => {
  setup(owner, "received");
  await screen.findByRole("link", { name: "alice" });
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "You" })).not.toBeInTheDocument();
});

it("validates the combined credit budget and releases credit before spending", async () => {
  const user = userEvent.setup();
  setup(owner, "given");
  const alice = await screen.findByRole("textbox", { name: "REP for alice" });
  const bob = screen.getByRole("textbox", { name: "REP for bob" });
  await user.clear(alice);
  await user.type(alice, "100");
  await user.clear(bob);
  await user.type(bob, "40");
  expect(
    screen.getByRole("button", { name: "Save", exact: true })
  ).toBeDisabled();
  expect(screen.getByRole("alert")).toHaveTextContent("credit limit");
  await user.clear(alice);
  await user.type(alice, "0");
  await user.clear(bob);
  await user.type(bob, "100");
  await user.click(screen.getByRole("button", { name: "Save", exact: true }));
  await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
  expect(post.mock.calls.map(([request]) => request)).toEqual([
    {
      endpoint: "profiles/alice/rep/rating",
      body: { amount: 0, category: "Artist" },
    },
    {
      endpoint: "profiles/bob/rep/rating",
      body: { amount: 100, category: "Artist" },
    },
  ]);
});

it("retains failed edits and does not repeat successful writes after a partial save", async () => {
  const user = userEvent.setup();
  const successfulWrite = post.getMockImplementation();
  let failBob = true;
  post.mockImplementation(async (request) => {
    if (request.endpoint.includes("/bob/") && failBob)
      throw new Error("Unavailable");
    return successfulWrite?.(request);
  });
  setup(owner, "given");
  const alice = await screen.findByRole("textbox", { name: "REP for alice" });
  const bob = screen.getByRole("textbox", { name: "REP for bob" });
  await user.clear(alice);
  await user.type(alice, "0");
  await user.clear(bob);
  await user.type(bob, "100");
  await user.click(screen.getByRole("button", { name: "Save", exact: true }));
  await screen.findByRole("alert");
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Save", exact: true })
    ).toBeEnabled()
  );
  expect(bob).toHaveValue("100");
  failBob = false;
  await user.click(screen.getByRole("button", { name: "Save", exact: true }));
  await waitFor(() => expect(post).toHaveBeenCalledTimes(3));
  expect(post.mock.calls.map(([request]) => request.endpoint)).toEqual([
    "profiles/alice/rep/rating",
    "profiles/bob/rep/rating",
    "profiles/bob/rep/rating",
  ]);
});

it.each([
  { direction: "received" as const, viewer: null },
  { direction: "given" as const, viewer: owner },
])(
  "keeps unauthorized $direction lists read-only",
  async ({ direction, viewer }) => {
    setup(target, direction, viewer);
    await screen.findByRole("link", { name: "alice" });
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "You" })).not.toBeInTheDocument();
  }
);
