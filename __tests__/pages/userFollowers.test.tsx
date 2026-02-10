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

// Use real helpers but we'll spy on the metadata builder
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

// Dummy Followers tab
function DummyFollowersTab({ profile }: { readonly profile: any }) {
  return <div data-testid="followers">FOLLOWERS:{profile.handle}</div>;
}

// NOTE: In your real page you used subroute = " " (single space). Keep that here.
const buildFactory = () =>
  createUserTabPage({
    subroute: " ",
    metaLabel: "Followers",
    Tab: DummyFollowersTab,
  });

describe("followers page via createUserTabPage", () => {
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

    expect(await screen.findByTestId("followers")).toHaveTextContent(
      "FOLLOWERS:alice"
    );

    expect(getUserProfile).toHaveBeenCalledWith({
      user: "alice",
      headers: { "x-test": "1" },
    });
    expect(userPageNeedsRedirect).toHaveBeenCalledWith({
      profile: expect.any(Object),
      req: { query: { user: "Alice", foo: "bar" } },
      subroute: " ",
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects when userPageNeedsRedirect returns destination", async () => {
    (userPageNeedsRedirect as jest.Mock).mockReturnValue({
      redirect: { destination: "/bob/followers" },
    });

    const { Page } = buildFactory();

    await Page({
      params: Promise.resolve({ user: "Carol" }),
      searchParams: Promise.resolve({}),
    } as any);

    expect(redirectMock).toHaveBeenCalledWith("/bob/followers");
  });

  it("generateMetadata uses helpers", async () => {
    const { generateMetadata } = buildFactory();
    const spy = jest.spyOn(Helpers, "getMetadataForUserPage");

    const meta = await generateMetadata({
      params: Promise.resolve({ user: "Dave" }),
    } as any);

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ handle: "dave", walletAddress: "0xabc" }),
      "Followers"
    );
    expect(getAppMetadata).toHaveBeenCalled();
    expect(meta).toEqual(
      expect.objectContaining({ title: expect.stringContaining("dave") })
    );
  });
});
