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
import {
  getUserProfile,
  userPageNeedsRedirect,
} from "@/helpers/server.helpers";

// A super simple Tab to verify rendering
function DummyStatsTab({ profile }: { readonly profile: any }) {
  return <div data-testid="stats">STATS:{profile.handle}</div>;
}

const buildFactory = () =>
  createUserTabPage({
    subroute: "stats",
    metaLabel: "Stats",
    Tab: DummyStatsTab,
  });

describe("stats page via createUserTabPage", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    (userPageNeedsRedirect as jest.Mock).mockReturnValue(null);
  });

  it("renders layout + tab when no redirect needed", async () => {
    const { Page } = buildFactory();

    const element = await Page({
      params: Promise.resolve({ user: "Alice" }),
      searchParams: Promise.resolve({ foo: "bar" }),
    } as any);

    render(element);

    expect(await screen.findByTestId("stats")).toHaveTextContent("STATS:alice");

    expect(getUserProfile).toHaveBeenCalledWith({
      user: "alice",
      headers: { "x-test": "1" },
    });
    expect(userPageNeedsRedirect).toHaveBeenCalledWith({
      profile: expect.any(Object),
      req: { query: { user: "Alice", foo: "bar" } },
      subroute: "stats",
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects when userPageNeedsRedirect returns destination", async () => {
    (userPageNeedsRedirect as jest.Mock).mockReturnValue({
      redirect: { destination: "/bob/stats" },
    });

    const { Page } = buildFactory();

    await Page({
      params: Promise.resolve({ user: "Carol" }),
      searchParams: Promise.resolve({}),
    } as any);

    expect(redirectMock).toHaveBeenCalledWith("/bob/stats");
  });

  it("generateMetadata uses helpers", async () => {
    const { generateMetadata } = buildFactory();
    const spy = jest.spyOn(Helpers, "getMetadataForUserPage");

    const meta = await generateMetadata({
      params: Promise.resolve({ user: "Dave" }),
    } as any);

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ handle: "dave", walletAddress: "0xabc" }),
      "Stats"
    );
    expect(getAppMetadata).toHaveBeenCalled();
    expect(meta).toEqual(
      expect.objectContaining({ title: expect.stringContaining("dave") })
    );
  });
});
