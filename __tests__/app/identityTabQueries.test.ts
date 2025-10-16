import {
  fetchIdentityTabData,
  createIdentityTabParams,
} from "@/app/[user]/identity/_lib/identityTabQueries";
import {
  getProfileCicStatements,
  getProfileCicRatings,
  getUserProfileActivityLogs,
} from "@/helpers/server.helpers";
import { getProfileLogTypes } from "@/helpers/profile-logs.helpers";
import {
  ProfileActivityFilterTargetType,
  ProfileRatersParamsOrderBy,
  RateMatter,
} from "@/enums";
import { SortDirection } from "@/entities/ISort";

jest.mock("@/helpers/server.helpers", () => {
  const actual = jest.requireActual("@/helpers/server.helpers");
  return {
    ...actual,
    getProfileCicStatements: jest.fn(),
    getProfileCicRatings: jest.fn(),
    getUserProfileActivityLogs: jest.fn(),
  };
});

describe("identityTabQueries", () => {
  let infoSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeAll(() => {
    infoSpy = jest.spyOn(console, "info").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    infoSpy.mockRestore();
    errorSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    infoSpy.mockClear();
    errorSpy.mockClear();
  });

  it("creates initial params with normalized handle and default log types", () => {
    const params = createIdentityTabParams("Alice");
    expect(params.activityLogParams.handleOrWallet).toBe("alice");
    expect(params.activityLogParams.page).toBe(1);
    expect(params.activityLogParams.pageSize).toBe(10);
    expect(params.activityLogParams.targetType).toBe(
      ProfileActivityFilterTargetType.ALL
    );
    expect(params.activityLogParams.logTypes).toEqual(
      getProfileLogTypes({ logTypes: [] })
    );
    expect(params.cicGivenParams).toEqual({
      page: 1,
      pageSize: 7,
      given: false,
      order: SortDirection.DESC,
      orderBy: ProfileRatersParamsOrderBy.RATING,
      handleOrWallet: "alice",
      matter: RateMatter.NIC,
    });
    expect(params.cicReceivedParams).toEqual({
      page: 1,
      pageSize: 7,
      given: true,
      order: SortDirection.DESC,
      orderBy: ProfileRatersParamsOrderBy.RATING,
      handleOrWallet: "alice",
      matter: RateMatter.NIC,
    });
  });

  it("fetches identity tab data and normalizes responses", async () => {
    const statements = [{ id: "statement" }];
    const ratingsGiven = {
      count: 2,
      data: [{ id: "given" }],
      page: 1,
      next: false,
    };
    const ratingsReceived = {
      count: 3,
      data: [{ id: "received" }],
      page: 1,
      next: false,
    };

    (getProfileCicStatements as jest.Mock).mockResolvedValue(statements);
    (getProfileCicRatings as jest.Mock).mockImplementation(
      async ({ params }: { params: { given: boolean } }) =>
        params.given ? ratingsReceived : ratingsGiven
    );

    const result = await fetchIdentityTabData({
      handleOrWallet: "Alice",
      headers: { authorization: "token" },
    });

    expect(getProfileCicStatements).toHaveBeenCalledWith({
      handleOrWallet: "alice",
      headers: { authorization: "token" },
    });
    expect(getUserProfileActivityLogs).not.toHaveBeenCalled();
    expect(getProfileCicRatings).toHaveBeenCalledTimes(2);
    expect(result.handleOrWallet).toBe("alice");
    expect(result.params.activityLogParams.handleOrWallet).toBe("alice");
    expect(result.data.statements).toEqual(statements);
    expect(result.data.activityLog).toBeNull();
    expect(result.data.cicGiven).toEqual(ratingsGiven);
    expect(result.data.cicReceived).toEqual(ratingsReceived);
    expect(result.errors).toEqual([]);
    expect(result.cache).toEqual({
      revalidateSeconds: 60,
      tags: [
        "identity:alice",
        "identity:alice:statements",
        "identity:alice:raters:given",
        "identity:alice:raters:received",
      ],
    });
  });

  it("returns safe defaults when upstream requests fail", async () => {
    (getProfileCicStatements as jest.Mock).mockRejectedValue(
      new Error("fail")
    );
    (getProfileCicRatings as jest.Mock).mockRejectedValue(
      new Error("fail")
    );

    const result = await fetchIdentityTabData({
      handleOrWallet: "alice",
      headers: {},
    });

    expect(result.data.statements).toEqual([]);
    expect(result.data.activityLog).toBeNull();
    expect(result.data.cicGiven).toEqual({
      count: 0,
      data: [],
      page: 1,
      next: false,
    });
    expect(result.data.cicReceived).toEqual({
      count: 0,
      data: [],
      page: 1,
      next: false,
    });
    expect(getUserProfileActivityLogs).not.toHaveBeenCalled();
    expect(result.cache.tags).toContain("identity:alice");
    expect(result.errors.map((error) => error.key).sort()).toEqual([
      "cicGiven",
      "cicReceived",
      "statements",
    ]);
  });
});
