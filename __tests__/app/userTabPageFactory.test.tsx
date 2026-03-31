import { render, screen } from "@testing-library/react";
import React from "react";

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

import * as Helpers from "@/helpers/Helpers";

jest.mock("@/components/user/layout/UserPageLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

const redirectMock = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import { getAppMetadata } from "@/components/providers/metadata";
import {
  getUserProfile,
  userPageNeedsRedirect,
} from "@/helpers/server.helpers";

function DummyCollectedTab({ profile }: { readonly profile: any }) {
  return <div data-testid="collected">COLLECTED:{profile.handle}</div>;
}

const buildFactory = () =>
  createUserTabPage({
    subroute: "collected",
    metaLabel: "Collected",
    Tab: DummyCollectedTab,
  });

describe("user tab page via createUserTabPage", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    (userPageNeedsRedirect as jest.Mock).mockReturnValue(null);
  });

  it("renders layout + tab when no redirect is needed", async () => {
    const { Page } = buildFactory();

    const element = await Page({
      params: Promise.resolve({ user: "Alice" }),
      searchParams: Promise.resolve({ address: "0x1" }),
    } as any);

    render(element);

    expect(await screen.findByTestId("collected")).toHaveTextContent(
      "COLLECTED:alice"
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

  it("does not invoke the tab component while composing the page", async () => {
    const clientTab = jest.fn(
      ({ profile }: { readonly profile: { handle: string } }) => (
        <div data-testid="client-tab">CLIENT:{profile.handle}</div>
      )
    );

    const { Page } = createUserTabPage({
      subroute: "collected",
      metaLabel: "Collected",
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
      metaLabel: "Test",
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

    const meta = await generateMetadata({
      params: Promise.resolve({ user: "Dave" }),
    } as any);

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ handle: "dave", walletAddress: "0xabc" }),
      "Collected"
    );
    expect(getAppMetadata).toHaveBeenCalled();
    expect(meta).toEqual(
      expect.objectContaining({ title: expect.stringContaining("dave") })
    );
  });
});
