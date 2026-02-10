import { render, screen } from "@testing-library/react";

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

// Mock layout to avoid needing React Query providers
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
import * as Helpers from "@/helpers/Helpers";
import {
  getUserProfile,
  userPageNeedsRedirect,
} from "@/helpers/server.helpers";

// A super simple Tab to verify rendering
function DummyWavesTab({ profile }: { readonly profile: any }) {
  return <div data-testid="waves-tab">WAVES:{profile.handle}</div>;
}

const buildFactory = () =>
  createUserTabPage({
    subroute: "waves",
    metaLabel: "Waves",
    Tab: DummyWavesTab,
  });

describe("waves page via createUserTabPage", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    (userPageNeedsRedirect as jest.Mock).mockReturnValue(null);
  });

  it("renders layout + tab when no redirect needed", async () => {
    const { Page } = buildFactory();

    const element = await Page({
      params: Promise.resolve({ user: "Bob" }),
      searchParams: Promise.resolve({ foo: "bar" }),
    } as any);

    render(element);

    // profile user is lowercased inside the factory
    expect(await screen.findByTestId("waves-tab")).toHaveTextContent(
      "WAVES:bob"
    );

    // Ensure helpers called correctly
    expect(getUserProfile).toHaveBeenCalledWith({
      user: "bob",
      headers: { "x-test": "1" },
    });
    expect(userPageNeedsRedirect).toHaveBeenCalledWith({
      profile: expect.any(Object),
      req: { query: { user: "Bob", foo: "bar" } },
      subroute: "waves",
    });

    // no redirect
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects when userPageNeedsRedirect returns destination", async () => {
    (userPageNeedsRedirect as jest.Mock).mockReturnValue({
      redirect: { destination: "/alice/waves" },
    });

    const { Page } = buildFactory();

    await Page({
      params: Promise.resolve({ user: "Carol" }),
      searchParams: Promise.resolve({}),
    } as any);

    expect(redirectMock).toHaveBeenCalledWith("/alice/waves");
  });

  it("generateMetadata uses helpers", async () => {
    const { generateMetadata } = buildFactory();
    const spy = jest.spyOn(Helpers, "getMetadataForUserPage");

    const meta = await generateMetadata({
      params: Promise.resolve({ user: "Dave" }),
    } as any);

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ handle: "dave", walletAddress: "0xabc" }),
      "Waves"
    );
    expect(getAppMetadata).toHaveBeenCalled();
    expect(meta).toEqual(
      expect.objectContaining({ title: expect.stringContaining("dave") })
    );
  });
});
