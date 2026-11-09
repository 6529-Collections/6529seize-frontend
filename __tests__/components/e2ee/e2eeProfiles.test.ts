/** @jest-environment node */
import { QueryClient } from "@tanstack/react-query";
import { resolveE2eeProfiles } from "@/components/e2ee/e2eeProfiles";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
const fetch = jest.mocked(commonApiFetch);

describe("encrypted profile resolution", () => {
  afterEach(() => jest.useRealTimers());
  beforeEach(() => {
    fetch.mockReset();
    jest.useFakeTimers();
  });

  it("omits failed identities and resolves them after cooldown without reloading", async () => {
    const client = new QueryClient();
    fetch.mockRejectedValueOnce(
      Object.assign(new Error("limited"), { status: 429 })
    );
    await expect(
      resolveE2eeProfiles(client, ["alice", "alice"])
    ).resolves.toEqual({});
    for (let n = 0; n < 10; n += 1)
      await expect(resolveE2eeProfiles(client, ["alice"])).resolves.toEqual({});
    expect(fetch).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(30_000);
    fetch.mockResolvedValue({ id: "alice", handle: "Alice", pfp: null });
    await expect(resolveE2eeProfiles(client, ["alice"])).resolves.toMatchObject(
      { alice: { handle: "Alice" } }
    );
    expect(fetch).toHaveBeenCalledTimes(2);
    client.clear();
  });

  it("rejects mismatched UUIDs but accepts legitimate profiles without a handle", async () => {
    const client = new QueryClient();
    fetch.mockResolvedValueOnce({ id: "other", handle: "Wrong" });
    await expect(resolveE2eeProfiles(client, ["alice"])).resolves.toEqual({});
    fetch.mockResolvedValueOnce({ id: "bob", handle: null, pfp: null });
    await expect(resolveE2eeProfiles(client, ["bob"])).resolves.toMatchObject({
      bob: { handle: null },
    });
    client.clear();
  });
});
