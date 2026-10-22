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

  it.each([
    { count: -1 },
    { count: "105" },
    { page: 0 },
    { next: "yes" },
    { data: null },
  ])("rejects invalid page metadata: %p", (invalid) => {
    expect(() => parseFollowingPage({ ...response, ...invalid })).toThrow();
  });

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
