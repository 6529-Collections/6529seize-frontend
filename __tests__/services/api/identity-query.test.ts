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
    ["../auth/logout", "identities/..%2Fauth%2Flogout"],
    ["0x1?x=1#y", "identities/0x1%3Fx%3D1%23y"],
  ])(
    "encodes %s so it stays inside the identities path",
    async (value, endpoint) => {
      await getIdentityQueryOptions({ handleOrWallet: value }).queryFn();

      expect(fetchMock).toHaveBeenCalledWith({ endpoint });
    }
  );

  it.each([".", ".."])("never requests the dot segment %s", async (value) => {
    await expect(
      getIdentityQueryOptions({ handleOrWallet: value }).queryFn()
    ).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

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
