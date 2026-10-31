jest.mock("@/contexts/TitleContext", () => ({ useSetTitle: jest.fn() }));
jest.mock("@/components/user/layout/UserPageDropModal", () => () => (
  <div data-testid="drop-modal" />
));
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSetTitle } from "@/contexts/TitleContext";
import {
  useIsTransferModeActive,
  useTransfer,
} from "@/components/nft-transfer/TransferState";
import { ContractType } from "@/types/enums";

// Outside a React server render `cache` is a pass-through, so model its
// per-request memoization to verify the page and metadata share loads.
jest.mock("react", () => {
  const actual = jest.requireActual("react");
  const memoStores: Array<Map<string, unknown>> = [];
  return {
    ...actual,
    __memoStores: memoStores,
    cache: <Args extends unknown[], Result>(fn: (...args: Args) => Result) => {
      const store = new Map<string, Result>();
      memoStores.push(store);
      return (...args: Args): Result => {
        const key = JSON.stringify(args);
        if (!store.has(key)) {
          store.set(key, fn(...args));
        }
        return store.get(key) as Result;
      };
    },
  };
});

jest.mock("@/helpers/server.app.helpers", () => ({
  getAppCommonHeaders: jest.fn(async () => ({ "x-test": "1" })),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn().mockResolvedValue([]),
}));

jest.mock("@/helpers/server.helpers", () => ({
  getUserProfile: jest.fn(async ({ user }: { user: string }) => ({
    handle: user,
    walletAddress: "0xabc",
    tdh: 0,
    rep: 0,
    level: 0,
  })),
  userPageNeedsRedirect: jest.fn(() => null),
}));

jest.mock("@/components/providers/metadata", () => ({
  getAppMetadata: jest.fn((v: any, options?: any) => ({
    ...v,
    ...(options?.robots ? { robots: options.robots } : {}),
    ...(options?.canonicalPath
      ? { alternates: { canonical: options.canonicalPath } }
      : {}),
  })),
  getLargeSocialCardMetadata: jest.fn((v: any) => v),
}));

import * as Helpers from "@/helpers/Helpers";

jest.mock("@/components/user/layout/UserPageTabTransition", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tab-transition">{children}</div>
  ),
}));

jest.mock("@/components/user/layout/UserPageLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="profile-layout">{children}</div>
  ),
}));

const redirectMock = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
  notFound: () => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  },
}));

import ProfileLayout from "@/app/[user]/(profile)/layout";
import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { getUserPageHeaderState } from "@/components/user/user-page-header/UserPageHeader";
import { getAppMetadata } from "@/components/providers/metadata";
import { commonApiFetch } from "@/services/api/common-api";
import {
  getUserProfile,
  userPageNeedsRedirect,
} from "@/helpers/server.helpers";

function DummyCollectedTab({ profile }: { readonly profile: any }) {
  return <div data-testid="collected">COLLECTED:{profile.handle}</div>;
}

const memoStores = (
  jest.requireMock("react") as { __memoStores: Array<Map<string, unknown>> }
).__memoStores;

const statementsRequestCount = () =>
  (commonApiFetch as jest.Mock).mock.calls.filter(([request]) =>
    String(request.endpoint).endsWith("/cic/statements")
  ).length;

const buildFactory = () =>
  createUserTabPage({
    subroute: "collected",
    Tab: DummyCollectedTab,
  });

describe("user tab page via createUserTabPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    memoStores.forEach((store) => store.clear());
    redirectMock.mockClear();
    (commonApiFetch as jest.Mock).mockResolvedValue([]);
    (getUserProfile as jest.Mock).mockImplementation(
      async ({ user }: { user: string }) => ({
        handle: user,
        walletAddress: "0xabc",
        tdh: 0,
        rep: 0,
        level: 0,
      })
    );
    (userPageNeedsRedirect as jest.Mock).mockReturnValue(null);
  });

  it("renders tab when no redirect is needed", async () => {
    const { Page } = buildFactory();

    const element = await Page({
      params: Promise.resolve({ user: "Alice" }),
      searchParams: Promise.resolve({ address: "0x1" }),
    } as any);

    render(element);

    expect(await screen.findByTestId("collected")).toHaveTextContent(
      "COLLECTED:alice"
    );
    expect(screen.getByTestId("tab-transition")).not.toContainElement(
      screen.getByTestId("drop-modal")
    );

    expect(getUserProfile).toHaveBeenCalledWith({
      user: "alice",
      headers: { "x-test": "1" },
    });
    expect(userPageNeedsRedirect).toHaveBeenCalledWith({
      profile: expect.any(Object),
      req: { query: { user: "Alice", address: "0x1" } },
      subroute: "collected",
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("hydrates profile aliases and preserves a newer client edit", async () => {
    const profile = {
      handle: "alice",
      wallets: [{ wallet: "0xABC", display: "Alice.eth" }],
    };
    (getUserProfile as jest.Mock).mockResolvedValue(profile);
    const client = new QueryClient();
    const edited = { ...profile, handle: "edited" };
    client.setQueryData(["PROFILE", "alice"], edited, {
      updatedAt: Date.now() + 10_000,
    });
    const { Page } = buildFactory();
    const element = await Page({
      params: Promise.resolve({ user: "Alice" }),
    });
    render(
      <QueryClientProvider client={client}>{element}</QueryClientProvider>
    );
    expect(client.getQueryData(["PROFILE", "alice"])).toEqual(edited);
    expect(client.getQueryData(["PROFILE", "0xabc"])).toEqual(profile);
    expect(client.getQueryData(["PROFILE", "alice.eth"])).toEqual(profile);
    expect(useSetTitle).toHaveBeenCalledWith(
      expect.stringContaining("Collected")
    );
    client.clear();
  });

  it("keeps transfer selections during filters and clears them when leaving Collected", async () => {
    function TransferTab() {
      const transfer = useTransfer();
      return (
        <button
          onClick={() => {
            transfer.setEnabled(true);
            transfer.select({
              key: "MEMES:1",
              contract: "0xabc",
              contractType: ContractType.ERC721,
              tokenId: 1,
            });
          }}
        >
          Selected: {transfer.count}
        </button>
      );
    }
    function TransferMode() {
      return (
        <output>Transfer mode: {String(useIsTransferModeActive())}</output>
      );
    }
    const collected = createUserTabPage({
      subroute: "collected",
      Tab: TransferTab,
      enableTransfer: true,
    });
    const identity = createUserTabPage({
      subroute: "",
      Tab: DummyCollectedTab,
    });
    const client = new QueryClient();
    const wrap = (page: React.ReactNode) => (
      <QueryClientProvider client={client}>
        <TransferMode />
        {page}
      </QueryClientProvider>
    );
    const params = Promise.resolve({ user: "alice" });
    const view = render(wrap(await collected.Page({ params })));
    fireEvent.click(screen.getByRole("button", { name: "Selected: 0" }));
    expect(screen.getByText("Transfer mode: true")).toBeInTheDocument();
    view.rerender(
      wrap(
        await collected.Page({
          params,
          searchParams: Promise.resolve({ address: "0xabc" }),
        })
      )
    );
    expect(
      screen.getByRole("button", { name: "Selected: 1" })
    ).toBeInTheDocument();
    view.rerender(wrap(await identity.Page({ params })));
    expect(screen.getByText("Transfer mode: false")).toBeInTheDocument();
    view.rerender(wrap(await collected.Page({ params })));
    expect(
      screen.getByRole("button", { name: "Selected: 0" })
    ).toBeInTheDocument();
    client.clear();
  });

  it("normalizes only a missing xTDH tab and preserves repeated query parameters", async () => {
    const { Page } = createUserTabPage({
      subroute: "xtdh",
      Tab: DummyCollectedTab,
    });
    await Page({
      params: Promise.resolve({ user: "alice" }),
      searchParams: Promise.resolve({
        locale: "et-EE",
        address: ["0x1", "0x2"],
      }),
    });
    expect(redirectMock).toHaveBeenCalledWith(
      "/alice/xtdh?locale=et-EE&address=0x1&address=0x2&tab=granted"
    );
  });

  it.each([
    "received",
    "active",
    "pending",
    "revoked",
    "failed",
    "unknown",
    "",
  ])("preserves an explicit xTDH tab value %s", async (tab) => {
    const { Page } = createUserTabPage({
      subroute: "xtdh",
      Tab: DummyCollectedTab,
    });
    await Page({
      params: Promise.resolve({ user: "alice" }),
      searchParams: Promise.resolve({ tab, sub: "all", address: "0x1" }),
    });
    expect(redirectMock).not.toHaveBeenCalled();
    expect(userPageNeedsRedirect).toHaveBeenCalledWith(
      expect.objectContaining({
        req: { query: { user: "alice", tab, sub: "all", address: "0x1" } },
      })
    );
  });

  it("combines canonical-profile and missing xTDH tab redirects", async () => {
    const actual = jest.requireActual<
      typeof import("@/helpers/server.helpers")
    >("@/helpers/server.helpers");
    jest
      .mocked(userPageNeedsRedirect)
      .mockImplementationOnce(actual.userPageNeedsRedirect);
    jest.mocked(getUserProfile).mockResolvedValueOnce({
      handle: "alice",
    } as Awaited<ReturnType<typeof getUserProfile>>);
    const { Page } = createUserTabPage({
      subroute: "xtdh",
      Tab: DummyCollectedTab,
    });
    await Page({
      params: Promise.resolve({ user: "0xalias" }),
      searchParams: Promise.resolve({ locale: "et-EE", address: "0x1" }),
    });
    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith(
      "/alice/xtdh?locale=et-EE&address=0x1&tab=granted"
    );
  });

  it("turns a structured missing-profile response into a route 404", async () => {
    (getUserProfile as jest.Mock).mockRejectedValueOnce(
      Object.assign(new Error("missing identity"), { status: 404 })
    );
    const { Page } = buildFactory();

    await expect(
      Page({ params: Promise.resolve({ user: "missing" }) } as any)
    ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });

  it("does not invoke the tab component while composing the page", async () => {
    const clientTab = jest.fn(
      ({ profile }: { readonly profile: { handle: string } }) => (
        <div data-testid="client-tab">CLIENT:{profile.handle}</div>
      )
    );

    const { Page } = createUserTabPage({
      subroute: "collected",
      Tab: clientTab,
    });

    const element = await Page({
      params: Promise.resolve({ user: "Alice" }),
      searchParams: Promise.resolve({}),
    } as any);

    expect(clientTab).not.toHaveBeenCalled();

    render(element);

    expect(await screen.findByTestId("client-tab")).toHaveTextContent(
      "CLIENT:alice"
    );
  });

  it("passes extra props from getTabProps to the Tab", async () => {
    function TabWithExtra({
      profile,
      extra,
    }: {
      readonly profile: any;
      readonly extra: string;
    }) {
      return (
        <div data-testid="extra">
          {extra}:{profile.handle}
        </div>
      );
    }
    const { Page } = createUserTabPage({
      subroute: "test",
      Tab: TabWithExtra,
      getTabProps: async ({ profile }) => ({
        extra: `hello-${profile.handle}`,
      }),
    });
    const element = await Page({
      params: Promise.resolve({ user: "Alice" }),
      searchParams: Promise.resolve({}),
    } as any);
    render(element);
    expect(await screen.findByTestId("extra")).toHaveTextContent(
      "hello-alice:alice"
    );
  });

  it("generateMetadata uses helpers", async () => {
    const { generateMetadata } = buildFactory();
    const spy = jest.spyOn(Helpers, "getMetadataForUserPage");
    (commonApiFetch as jest.Mock).mockResolvedValueOnce([
      {
        statement_group: "GENERAL",
        statement_type: "BIO",
        statement_value: "Public artist biography",
      },
    ]);

    const meta = await generateMetadata({
      params: Promise.resolve({ user: "Dave" }),
    } as any);

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ handle: "dave", walletAddress: "0xabc" }),
      "collected",
      "Public artist biography"
    );
    expect(getAppMetadata).toHaveBeenCalled();
    expect(meta).toEqual(
      expect.objectContaining({
        title: expect.stringContaining("dave"),
        alternates: { canonical: "/dave/collected" },
        robots: { index: true, follow: true },
      })
    );
  });

  it("encodes the profile identity in the public BIO endpoint", async () => {
    const { generateMetadata } = buildFactory();

    await generateMetadata({
      params: Promise.resolve({ user: "Alice%2FAdmin" }),
    });

    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "profiles/alice%2Fadmin/cic/statements",
      headers: { "x-test": "1" },
    });
  });

  it("loads the identity once when the layout, page and metadata render together", async () => {
    const { Page, generateMetadata } = buildFactory();
    const params = Promise.resolve({ user: "Alice" });

    await Promise.all([
      ProfileLayout({ params, children: null }),
      Page({ params, searchParams: Promise.resolve({}) } as any),
      generateMetadata({ params } as any),
    ]);

    expect(getUserProfile).toHaveBeenCalledTimes(1);
    expect(statementsRequestCount()).toBe(1);
  });

  it.each([
    ["Dave", "dave", "profiles/dave/cic/statements"],
    ["Br%C3%9Cder", "br%c3%9cder", "profiles/br%C3%BCder/cic/statements"],
  ])(
    "shares one public bio request between metadata and the header for %s",
    async (routeUser, headerIdentity, endpoint) => {
      const { generateMetadata } = buildFactory();

      await generateMetadata({ params: Promise.resolve({ user: routeUser }) });
      // The header passes the lowercased route identity it was rendered with.
      await getUserPageHeaderState(headerIdentity, null, null);

      expect(statementsRequestCount()).toBe(1);
      expect(commonApiFetch).toHaveBeenCalledWith({
        endpoint,
        headers: { "x-test": "1" },
      });
    }
  );

  it("renders the tab before the header requests finish, then applies the header snapshot", async () => {
    let resolveStatements: (statements: unknown) => void = () => undefined;
    (commonApiFetch as jest.Mock).mockImplementation(
      ({ endpoint }: { endpoint: string }) =>
        endpoint.endsWith("/cic/statements")
          ? new Promise((resolve) => {
              resolveStatements = resolve;
            })
          : Promise.resolve(null)
    );
    const client = new QueryClient();
    const { Page } = buildFactory();

    const element = await Page({ params: Promise.resolve({ user: "Alice" }) });
    render(
      <QueryClientProvider client={client}>{element}</QueryClientProvider>
    );

    expect(screen.getByTestId("collected")).toHaveTextContent(
      "COLLECTED:alice"
    );
    const statementsKey = [QueryKey.PROFILE_CIC_STATEMENTS, "alice"];
    expect(client.getQueryData(statementsKey)).toBeUndefined();

    await waitFor(() => expect(statementsRequestCount()).toBe(1));
    const statements = [{ statement_type: "BIO", statement_value: "Bio" }];
    await act(async () => {
      resolveStatements(statements);
    });

    await waitFor(() =>
      expect(client.getQueryData(statementsKey)).toEqual(statements)
    );
    client.clear();
  });

  it("requests the public bio while the identity request is still pending", async () => {
    let resolveProfile: (profile: unknown) => void = () => undefined;
    (getUserProfile as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveProfile = resolve;
        })
    );
    const { generateMetadata } = buildFactory();

    const metadata = generateMetadata({
      params: Promise.resolve({ user: "Dave" }),
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "profiles/dave/cic/statements",
      headers: { "x-test": "1" },
    });

    resolveProfile({ handle: "dave" });
    await expect(metadata).resolves.toEqual(
      expect.objectContaining({ alternates: { canonical: "/dave/collected" } })
    );
  });

  it("requests the identity while the search params are still pending", async () => {
    let resolveSearchParams: (query: Record<string, string>) => void = () =>
      undefined;
    const searchParams = new Promise<Record<string, string>>((resolve) => {
      resolveSearchParams = resolve;
    });
    const { Page } = buildFactory();

    const page = Page({
      params: Promise.resolve({ user: "Alice" }),
      searchParams,
    } as any);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(getUserProfile).toHaveBeenCalledTimes(1);

    resolveSearchParams({ address: "0x1" });
    render(await page);
    expect(await screen.findByTestId("collected")).toBeInTheDocument();
  });

  it("returns a route 404 for an unknown profile without touching the tab", async () => {
    (getUserProfile as jest.Mock).mockRejectedValueOnce(
      Object.assign(new Error("missing identity"), { status: 404 })
    );
    const tab = jest.fn(() => <div data-testid="tab" />);
    const getTabProps = jest.fn(async () => ({}));
    const { Page } = createUserTabPage({
      subroute: "collected",
      Tab: tab,
      getTabProps,
    });

    await expect(
      Page({ params: Promise.resolve({ user: "ghost" }) } as any)
    ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
    expect(getTabProps).not.toHaveBeenCalled();
    expect(tab).not.toHaveBeenCalled();
  });

  it("noindexes profile utility tabs and temporary profile failures", async () => {
    const subscriptions = createUserTabPage({
      subroute: "subscriptions",
      Tab: DummyCollectedTab,
    });
    const utilityMetadata = await subscriptions.generateMetadata({
      params: Promise.resolve({ user: "Dave" }),
    });
    expect(utilityMetadata.robots).toEqual({ index: false, follow: true });

    // A new request starts with an empty per-request memo.
    memoStores.forEach((store) => store.clear());
    (getUserProfile as jest.Mock).mockRejectedValueOnce(
      Object.assign(new Error("upstream failed"), { status: 503 })
    );
    const unavailableMetadata = await buildFactory().generateMetadata({
      params: Promise.resolve({ user: "Dave" }),
    });
    expect(unavailableMetadata.robots).toEqual({
      index: false,
      follow: true,
    });
    expect(unavailableMetadata.alternates?.canonical).toBeUndefined();
  });
});
