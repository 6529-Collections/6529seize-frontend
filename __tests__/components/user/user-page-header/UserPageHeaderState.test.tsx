import { hydrate, QueryClient } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { commonApiFetch } from "@/services/api/common-api";
import { getProfileCmsPrimarySite } from "@/lib/profile-cms/runtime/fetcher";
import { getUserPageHeaderState } from "@/components/user/user-page-header/UserPageHeader";

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
jest.mock(
  "@/components/user/user-page-header/UserPageHeaderClient",
  () => () => null
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
});
