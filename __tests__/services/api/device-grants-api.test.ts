import { commonApiFetch } from "@/services/api/common-api";
import {
  fetchAuthorWallets,
  fetchDropsSignedEvents,
} from "@/services/api/device-grants-api";

jest.mock("@/services/api/common-api", () => ({
  ...jest.requireActual("@/services/api/common-api"),
  commonApiFetch: jest.fn(),
}));

const PRIMARY = "0xAbCd000000000000000000000000000000000001";
const fetchMock = jest.mocked(commonApiFetch);

const apiError = (status: number) =>
  Object.assign(new Error(`HTTP ${status}`), { status });

describe("fetchAuthorWallets", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("returns the primary address and every wallet of its profile", async () => {
    fetchMock.mockResolvedValue({
      wallets: [{ wallet: "0x01" }, { wallet: "0x02" }],
    });
    const signal = new AbortController().signal;

    await expect(fetchAuthorWallets(PRIMARY, signal)).resolves.toEqual([
      PRIMARY,
      "0x01",
      "0x02",
    ]);
    expect(fetchMock).toHaveBeenCalledWith({
      endpoint: `identities/${PRIMARY.toLowerCase()}`,
      signal,
      errorMode: "structured",
    });
  });

  it("counts only the primary address when no profile owns it", async () => {
    fetchMock.mockRejectedValue(apiError(404));

    await expect(fetchAuthorWallets(PRIMARY)).resolves.toEqual([PRIMARY]);
  });

  it.each([
    ["a server error", apiError(503)],
    ["rate limiting", apiError(429)],
    ["a network failure", new TypeError("Failed to fetch")],
  ])(
    "throws on %s instead of shrinking the wallet list",
    async (_case, error) => {
      fetchMock.mockRejectedValue(error);

      await expect(fetchAuthorWallets(PRIMARY)).rejects.toBe(error);
    }
  );
});

describe("fetchDropsSignedEvents", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("reads several drops' signed events in one request", async () => {
    const batch = {
      drops: [],
      grants: [],
      unavailable: [],
      truncated_drop_ids: [],
    };
    fetchMock.mockResolvedValue(batch);
    const signal = new AbortController().signal;

    await expect(
      fetchDropsSignedEvents(["drop-1", "drop-2"], signal)
    ).resolves.toBe(batch);
    expect(fetchMock).toHaveBeenCalledWith({
      endpoint: "drops/signed-events",
      params: { drop_ids: "drop-1,drop-2" },
      signal,
      errorMode: "structured",
    });
  });
});
