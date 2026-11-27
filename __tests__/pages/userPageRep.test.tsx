jest.mock("@/contexts/TitleContext", () => ({ useSetTitle: jest.fn() }));
jest.mock("@/components/user/layout/UserPageDropModal", () => () => null);
jest.mock("@/components/user/rep/UserPageRepWrapper", () => () => null);
jest.mock("next/headers", () => ({
  headers: async () => new Map([["sec-fetch-mode", "navigate"]]),
}));
jest.mock("next/server", () => ({ userAgent: () => ({ device: {} }) }));
import { render, screen } from "@testing-library/react";
import React from "react";

// Mocks for helpers used by the factory
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
  getAppMetadata: jest.fn((v: any) => v),
  getLargeSocialCardMetadata: jest.fn((v: any) => v),
}));

// Use real helpers but we'll spy on the metadata builder
import * as Helpers from "@/helpers/Helpers";

jest.mock("@/components/user/layout/UserPageTabTransition", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tab-transition">{children}</div>
  ),
}));

// Mock redirect from next/navigation
const redirectMock = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

// Import after mocks
import ProfilePage from "@/app/[user]/(profile)/page";
import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import { getAppMetadata } from "@/components/providers/metadata";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import {
  getUserProfile,
  userPageNeedsRedirect,
} from "@/helpers/server.helpers";
import { commonApiFetch } from "@/services/api/common-api";

// Dummy Rep tab
function DummyRepTab({ profile }: { readonly profile: any }) {
  return <div data-testid="rep">REP:{profile.handle}</div>;
}

const buildFactory = () =>
  createUserTabPage({ subroute: "", Tab: DummyRepTab });

describe("profile ratings prefetch", () => {
  const wallet = "0x0000000000000000000000000000000000000529";

  it.each([
    { id: null, handle: null, user: wallet, ratings: [] },
    {
      id: "profile-id",
      handle: "alice",
      user: "alice",
      ratings: ["rep/overview", "rep/categories", "cic/overview"],
    },
  ])(
    "prefetches ratings according to the profile ID for $user",
    async ({ id, handle, user, ratings }) => {
      const fetchApi = jest.mocked(commonApiFetch);
      fetchApi.mockClear();
      jest.mocked(getUserProfile).mockResolvedValueOnce({
        id,
        handle,
        primary_wallet: wallet,
        wallets: [{ wallet }],
      } as ApiIdentity);

      await ProfilePage({ params: Promise.resolve({ user }) });

      const endpoints = fetchApi.mock.calls.map(([{ endpoint }]) => endpoint);
      expect(
        endpoints.filter((endpoint) =>
          /\/(?:rep|cic)\/(?:overview|categories)$/.test(endpoint)
        )
      ).toEqual(ratings.map((suffix) => `profiles/${user}/${suffix}`));
      expect(endpoints).toContain(`profiles/${user}/cic/statements`);
      expect(endpoints).toContain("profile-logs");
    }
  );
});

describe("rep page via createUserTabPage", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    (userPageNeedsRedirect as jest.Mock).mockReturnValue(null);
  });

  it("renders tab when no redirect needed", async () => {
    const { Page } = buildFactory();

    const element = await Page({
      params: Promise.resolve({ user: "Alice" }),
      searchParams: Promise.resolve({ foo: "bar" }),
    } as any);

    render(element);

    expect(await screen.findByTestId("rep")).toHaveTextContent("REP:alice");

    expect(getUserProfile).toHaveBeenCalledWith({
      user: "alice",
      headers: { "x-test": "1" },
    });
    expect(userPageNeedsRedirect).toHaveBeenCalledWith({
      profile: expect.any(Object),
      req: { query: { user: "Alice", foo: "bar" } },
      subroute: "",
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects when userPageNeedsRedirect returns destination", async () => {
    (userPageNeedsRedirect as jest.Mock).mockReturnValue({
      redirect: { destination: "/bob/identity" },
    });

    const { Page } = buildFactory();

    await Page({
      params: Promise.resolve({ user: "Carol" }),
      searchParams: Promise.resolve({}),
    } as any);

    expect(redirectMock).toHaveBeenCalledWith("/bob/identity");
  });

  it("generateMetadata uses helpers", async () => {
    const { generateMetadata } = buildFactory();
    const spy = jest.spyOn(Helpers, "getMetadataForUserPage");

    const meta = await generateMetadata({
      params: Promise.resolve({ user: "Dave" }),
    } as any);

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ handle: "dave", walletAddress: "0xabc" }),
      "",
      null
    );
    expect(getAppMetadata).toHaveBeenCalled();
    expect(meta).toEqual(
      expect.objectContaining({ title: expect.stringContaining("dave") })
    );
  });
});
