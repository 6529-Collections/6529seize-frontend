import {
  hydrate,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { commonApiFetch } from "@/services/api/common-api";
import { getProfileCmsPrimarySite } from "@/lib/profile-cms/runtime/fetcher";
import UserPageHeader, {
  getUserPageHeaderState,
} from "@/components/user/user-page-header/UserPageHeader";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

jest.mock("@/helpers/server.app.helpers", () => ({
  getAppCommonHeaders: jest.fn(async () => ({})),
}));
jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/lib/profile-cms/runtime/fetcher", () => ({
  getProfileCmsPrimarySite: jest.fn(),
}));
jest.mock("@/lib/profile-cms/runtime/routes", () => ({
  getCmsPublicPath: () => "/alice/index.html",
}));
const mockHeaderClientProps = jest.fn();
jest.mock(
  "@/components/user/user-page-header/UserPageHeaderClient",
  () => (props: Record<string, unknown>) => {
    mockHeaderClientProps(props);
    return null;
  }
);

const followerKey = [
  QueryKey.IDENTITY_FOLLOWERS,
  { profile_id: "alice-id", page_size: 1 },
];
const websiteKey = [QueryKey.PROFILE_HEADER, "alice", "cmsWebsiteHref"];
const statementKey = [QueryKey.PROFILE_CIC_STATEMENTS, "alice"];

describe("profile header refresh snapshots", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, "now").mockReturnValue(1000);
    jest.mocked(commonApiFetch).mockImplementation(async ({ endpoint }) => {
      if (endpoint === "profile-logs") {
        return { data: [{ created_at: 1700000000000 }] };
      }
      if (endpoint.startsWith("identity-subscriptions/")) {
        return { count: 7, data: [] };
      }
      return [{ statement_value: "Server bio" }];
    });
    jest.mocked(getProfileCmsPrimarySite).mockResolvedValue(null);
  });

  afterEach(() => jest.restoreAllMocks());

  it("refreshes followers and server fields using the existing follower key", async () => {
    const client = new QueryClient();
    hydrate(client, await getUserPageHeaderState("alice", "alice-id", "alice"));
    expect(client.getQueryData(followerKey)).toEqual({ count: 7, data: [] });
    expect(
      client.getQueryData([QueryKey.PROFILE_HEADER, "alice", "enabledAt"])
    ).toBe(new Date(1700000000000).toISOString());
    expect(client.getQueryData(websiteKey)).toBeNull();
    client.clear();
  });

  it("does not overwrite a newer local edit with a delayed server snapshot", async () => {
    const snapshot = await getUserPageHeaderState("alice", "alice-id", "alice");
    const client = new QueryClient();
    const editedBio = [{ statement_value: "Newer edited bio" }];
    client.setQueryData(statementKey, editedBio, { updatedAt: 2000 });
    hydrate(client, snapshot);
    expect(client.getQueryData(statementKey)).toEqual(editedBio);
    client.clear();
  });

  it("retains known data on failure, retries later, and accepts a successful removal", async () => {
    const client = new QueryClient();
    client.setQueryData(
      followerKey,
      { count: 3, data: [] },
      { updatedAt: 500 }
    );
    client.setQueryData(websiteKey, "/alice/index.html", { updatedAt: 500 });
    jest
      .mocked(commonApiFetch)
      .mockRejectedValue(new Error("Temporarily unavailable"));
    jest
      .mocked(getProfileCmsPrimarySite)
      .mockRejectedValue(new Error("Temporarily unavailable"));
    hydrate(client, await getUserPageHeaderState("alice", "alice-id", "alice"));
    expect(client.getQueryData(followerKey)).toEqual({ count: 3, data: [] });
    expect(client.getQueryData(websiteKey)).toBe("/alice/index.html");

    jest.mocked(commonApiFetch).mockResolvedValue({ count: 9, data: [] });
    jest.mocked(getProfileCmsPrimarySite).mockResolvedValue(null);
    hydrate(client, await getUserPageHeaderState("alice", "alice-id", "alice"));
    expect(client.getQueryData(followerKey)).toEqual({ count: 9, data: [] });
    expect(client.getQueryData(websiteKey)).toBeNull();
    client.clear();
  });

  const renderHeader = async () => {
    const element = await UserPageHeader({
      profile: { id: "alice-id", handle: "alice" } as ApiIdentity,
      handleOrWallet: "Alice",
      fallbackMainAddress: "0x1",
    });
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>{element}</QueryClientProvider>
    );
    client.clear();
    return mockHeaderClientProps.mock.calls.at(-1)?.[0];
  };

  it("hands the header its server snapshot so the server HTML and hydration render match", async () => {
    await expect(renderHeader()).resolves.toEqual(
      expect.objectContaining({
        initialStatements: [{ statement_value: "Server bio" }],
        profileEnabledAt: new Date(1700000000000).toISOString(),
        followersCount: 7,
        cmsWebsiteHref: null,
      })
    );
  });

  it("hands the header empty values when its server requests fail", async () => {
    jest
      .mocked(commonApiFetch)
      .mockRejectedValue(new Error("Temporarily unavailable"));
    jest
      .mocked(getProfileCmsPrimarySite)
      .mockRejectedValue(new Error("Temporarily unavailable"));

    await expect(renderHeader()).resolves.toEqual(
      expect.objectContaining({
        initialStatements: [],
        profileEnabledAt: null,
        followersCount: null,
        cmsWebsiteHref: null,
      })
    );
  });
});
