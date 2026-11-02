import {
  fetchFollowingPage,
  parseFollowingPage,
} from "@/services/api/following";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));

const target = {
  id: "artist-id",
  handle: "artist",
  pfp: null,
  level: 23,
  primary_address: "0x123",
};
const response = {
  data: [{ target, actions: ["DROP_CREATED"] }],
  count: 105,
  page: 1,
  next: true,
};

describe("outgoing IDENTITY response boundary", () => {
  it("maps profile overviews to existing rows while preserving the API total and pagination", () => {
    expect(parseFollowingPage(response)).toEqual({
      data: [{ identity: target }],
      count: 105,
      page: 1,
      next: true,
    });
  });

  it("accepts archived/handleless identities and strips fields unused by rows", () => {
    const identity = { ...target, handle: null, level: 0 };
    expect(
      parseFollowingPage({
        ...response,
        data: [{ target: { ...identity, archived: true } }],
      }).data
    ).toEqual([{ identity }]);
  });

  it.each([
    null,
    "artist-id",
    {},
    { ...target, id: undefined },
    { ...target, handle: 1 },
    { ...target, handle: "../preferences" },
    { ...target, handle: "." },
    { ...target, handle: ".." },
    { ...target, pfp: {} },
    { ...target, level: "23" },
    { ...target, primary_address: null },
  ])(
    "rejects malformed targets instead of dropping rows or fabricating an empty list: %p",
    (invalid) => {
      expect(() =>
        parseFollowingPage({ ...response, data: [{ target: invalid }] })
      ).toThrow();
    }
  );

  it.each(["a/b", "a\\b", "?", "#x", ".", "..", "%2e%2e"])(
    "rejects route-unsafe fallback addresses for handleless identities: %s",
    (primary_address) => {
      expect(() =>
        parseFollowingPage({
          ...response,
          data: [{ target: { ...target, handle: null, primary_address } }],
        })
      ).toThrow();
    }
  );

  it("uses the handle without imposing route restrictions on an unused fallback", () => {
    const identity = { ...target, primary_address: "unused/fallback" };
    expect(
      parseFollowingPage({ ...response, data: [{ target: identity }] }).data
    ).toEqual([{ identity }]);
  });

  it.each([
    { count: -1 },
    { count: "105" },
    { page: 0 },
    { next: "yes" },
    { data: null },
  ])("rejects invalid page metadata: %p", (invalid) => {
    expect(() => parseFollowingPage({ ...response, ...invalid })).toThrow();
  });

  it.each([1, 100])(
    "requests page size %i with the same authoritative total",
    async (pageSize) => {
      jest.mocked(commonApiFetch).mockResolvedValue(response);
      const { signal } = new AbortController();
      await expect(
        fetchFollowingPage(1, signal, pageSize)
      ).resolves.toMatchObject({ count: 105 });
      expect(commonApiFetch).toHaveBeenLastCalledWith({
        endpoint: "identity-subscriptions/outgoing/IDENTITY",
        params: { page: "1", page_size: String(pageSize) },
        signal,
      });
    }
  );

  it("uses the shared authenticated fetch and forwards cancellation", async () => {
    jest.mocked(commonApiFetch).mockResolvedValue(response);
    const { signal } = new AbortController();
    await expect(fetchFollowingPage(2, signal)).resolves.toMatchObject({
      count: 105,
    });
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "identity-subscriptions/outgoing/IDENTITY",
      params: { page: "2", page_size: "100" },
      signal,
    });
  });
});
