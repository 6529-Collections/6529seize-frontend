import { getIdentityQueryOptions } from "@/services/api/identity-query";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(async () => ({})),
}));

const fetchMock = jest.mocked(commonApiFetch);

describe("getIdentityQueryOptions", () => {
  beforeEach(() => {
    fetchMock.mockClear();
  });

  it.each([
    ["a handle", "Punk6529", "identities/punk6529"],
    ["an ENS name", "punk6529.eth", "identities/punk6529.eth"],
    [
      "a wallet",
      "0xAbC0000000000000000000000000000000000001",
      "identities/0xabc0000000000000000000000000000000000001",
    ],
  ])("requests %s as one path segment", async (_case, value, endpoint) => {
    await getIdentityQueryOptions({ handleOrWallet: value }).queryFn();

    expect(fetchMock).toHaveBeenCalledWith({ endpoint });
  });

  it.each([
    ["raw", "café.eth"],
    ["percent-encoded, as a route param can arrive", "caf%C3%A9.eth"],
    ["percent-encoded in lower case", "caf%c3%a9.eth"],
  ])(
    "requests a non-ASCII name given %s as the same single-encoded segment",
    async (_case, value) => {
      await getIdentityQueryOptions({ handleOrWallet: value }).queryFn();

      expect(fetchMock).toHaveBeenCalledWith({
        endpoint: "identities/caf%C3%A9.eth",
      });
    }
  );

  it.each([
    ["a slash", "../auth/logout", "identities/..%2Fauth%2Flogout"],
    ["an encoded slash", "..%2Fauth%2Flogout", "identities/..%2Fauth%2Flogout"],
    ["a query and fragment", "0x1?x=1#y", "identities/0x1%3Fx%3D1%23y"],
    ["invalid encoding", "100%", "identities/100%25"],
  ])(
    "keeps a value with %s inside the identities path",
    async (_case, value, endpoint) => {
      await getIdentityQueryOptions({ handleOrWallet: value }).queryFn();

      expect(fetchMock).toHaveBeenCalledWith({ endpoint });
    }
  );

  it.each([".", "..", "%2E%2E", "%2e"])(
    "never requests the dot segment %s",
    async (value) => {
      await expect(
        getIdentityQueryOptions({ handleOrWallet: value }).queryFn()
      ).rejects.toThrow();
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it("passes headers through", async () => {
    await getIdentityQueryOptions({
      handleOrWallet: "punk6529",
      headers: { "x-test": "1" },
    }).queryFn();

    expect(fetchMock).toHaveBeenCalledWith({
      endpoint: "identities/punk6529",
      headers: { "x-test": "1" },
    });
  });
});
