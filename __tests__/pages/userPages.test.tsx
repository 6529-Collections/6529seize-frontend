import { render, screen } from "@testing-library/react";
import React from "react";

// Mocks for helpers used by the factory
jest.mock("@/helpers/server.app.helpers", () => ({
  getAppCommonHeaders: jest.fn(async () => ({ "x-test": "1" })),
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
}));

// Use the real helpers impl for metadata but we'll spy on the call
import * as Helpers from "@/helpers/Helpers";

// Mock layout to avoid React Query provider requirements
jest.mock("@/components/user/layout/UserPageLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

// Mock redirect from next/navigation so we can assert it
const redirectMock = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

// Import after mocks
import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import { getAppMetadata } from "@/components/providers/metadata";
import { userPageNeedsRedirect } from "@/helpers/server.helpers";

// Dummy tabs for index and proxy
function DummyHomeTab({ profile }: { readonly profile: any }) {
  return <div data-testid="home">HOME:{profile.handle}</div>;
}
function DummyProxyTab({ profile }: { readonly profile: any }) {
  return <div data-testid="proxy">PROXY:{profile.handle}</div>;
}

const buildHomeFactory = () =>
  createUserTabPage({
    subroute: null as any,
    metaLabel: "Home",
    Tab: DummyHomeTab,
  });
const buildProxyFactory = () =>
  createUserTabPage({
    subroute: "proxy",
    metaLabel: "Proxy",
    Tab: DummyProxyTab,
  });

describe("user index page via createUserTabPage", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    (userPageNeedsRedirect as jest.Mock).mockReturnValue(null);
  });

  it("renders layout + tab when no redirect needed", async () => {
    const { Page } = buildHomeFactory();
    const element = await Page({
      params: Promise.resolve({ user: "Alice" }),
      searchParams: Promise.resolve({}),
    } as any);
    render(element);
    expect(await screen.findByTestId("home")).toHaveTextContent("HOME:alice");
  });

  it("redirects when needed", async () => {
    (userPageNeedsRedirect as jest.Mock).mockReturnValue({
      redirect: { destination: "/bob" },
    });
    const { Page } = buildHomeFactory();
    await Page({
      params: Promise.resolve({ user: "Carol" }),
      searchParams: Promise.resolve({}),
    } as any);
    expect(redirectMock).toHaveBeenCalledWith("/bob");
  });

  it("generateMetadata works for index", async () => {
    const spy = jest.spyOn(Helpers, "getMetadataForUserPage");
    const { generateMetadata } = buildHomeFactory();
    await generateMetadata({
      params: Promise.resolve({ user: "dave" }),
      searchParams: Promise.resolve({}),
    } as any);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ handle: "dave" }),
      "Home"
    );
    expect(getAppMetadata).toHaveBeenCalled();
  });
});

describe("proxy page via createUserTabPage", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    (userPageNeedsRedirect as jest.Mock).mockReturnValue(null);
  });

  it("renders layout + proxy tab when no redirect needed", async () => {
    const { Page } = buildProxyFactory();
    const element = await Page({
      params: Promise.resolve({ user: "Alice" }),
      searchParams: Promise.resolve({ foo: "bar" }),
    } as any);
    render(element);
    expect(await screen.findByTestId("proxy")).toHaveTextContent("PROXY:alice");
  });

  it("redirects when needed", async () => {
    (userPageNeedsRedirect as jest.Mock).mockReturnValue({
      redirect: { destination: "/bob/proxy" },
    });
    const { Page } = buildProxyFactory();
    await Page({
      params: Promise.resolve({ user: "Carol" }),
      searchParams: Promise.resolve({}),
    } as any);
    expect(redirectMock).toHaveBeenCalledWith("/bob/proxy");
  });

  it("generateMetadata works for proxy", async () => {
    const spy = jest.spyOn(Helpers, "getMetadataForUserPage");
    const { generateMetadata } = buildProxyFactory();
    await generateMetadata({
      params: Promise.resolve({ user: "dave" }),
      searchParams: Promise.resolve({}),
    } as any);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ handle: "dave" }),
      "Proxy"
    );
    expect(getAppMetadata).toHaveBeenCalled();
  });
});
