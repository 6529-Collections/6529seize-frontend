const mockFetch = jest.fn();
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: (...args: unknown[]) => mockFetch(...args),
}));

type OwnersModule = typeof import("@/lib/signed-records/record-owners");

const WALLET_A = "0x000000000000000000000000000000000000000a";
const WALLET_B = "0x000000000000000000000000000000000000000b";
const PRINCIPAL_A = `0x${"aa".repeat(32)}`;

const load = (): OwnersModule => {
  let loaded: OwnersModule | undefined;
  jest.isolateModules(() => {
    loaded = jest.requireActual<OwnersModule>(
      "@/lib/signed-records/record-owners"
    );
  });
  return loaded!;
};

const identities: Record<string, string> = {
  alice: WALLET_A.toUpperCase().replace("0X", "0x"),
  "profile-b": WALLET_B,
};

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockImplementation(
    async ({
      endpoint,
      params,
    }: {
      endpoint: string;
      params?: Record<string, string>;
    }) => {
      if (endpoint.startsWith("identities/")) {
        const key = decodeURIComponent(endpoint.slice("identities/".length));
        const wallet = identities[key];
        if (!wallet) throw new Error("Profile not found");
        return { id: key, handle: key, primary_wallet: wallet };
      }
      if (endpoint === "signed-records/owners") {
        const wallets = (params?.["wallets"] ?? "").split(",");
        return {
          anchor: 100,
          owners: wallets.map((wallet) => ({
            wallet,
            // A bound wallet maps to its principal, an unbound one to itself.
            owner: wallet === WALLET_A ? PRINCIPAL_A : wallet,
          })),
        };
      }
      throw new Error(`unexpected ${endpoint}`);
    }
  );
});

describe("ownerOfProfile", () => {
  it("looks up the profile's primary wallet, then its owner", async () => {
    const { ownerOfProfile } = load();
    await expect(ownerOfProfile("Alice")).resolves.toBe(PRINCIPAL_A);
    expect(mockFetch).toHaveBeenCalledWith({
      endpoint: "identities/alice",
      errorMode: "structured",
    });
    expect(mockFetch).toHaveBeenCalledWith({
      endpoint: "signed-records/owners",
      params: { wallets: WALLET_A },
      includeWalletAuth: false,
      cache: "no-store",
      errorMode: "structured",
    });
  });

  it("names an unbound wallet as itself", async () => {
    const { ownerOfProfile } = load();
    await expect(ownerOfProfile("profile-b")).resolves.toBe(WALLET_B);
  });

  it("reuses answers for a minute", async () => {
    const { ownerOfProfile } = load();
    await ownerOfProfile("alice");
    await ownerOfProfile("alice");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("fails when the profile can't be found", async () => {
    const { ownerOfProfile } = load();
    await expect(ownerOfProfile("nobody")).rejects.toThrow("Profile not found");
  });
});

describe("ownersOfProfiles", () => {
  it("answers in order with one owners request", async () => {
    const { ownersOfProfiles } = load();
    await expect(ownersOfProfiles(["profile-b", "alice"])).resolves.toEqual([
      WALLET_B,
      PRINCIPAL_A,
    ]);
    const ownerCalls = mockFetch.mock.calls.filter(
      ([request]) => request.endpoint === "signed-records/owners"
    );
    expect(ownerCalls).toHaveLength(1);
    expect(ownerCalls[0]![0].params.wallets).toBe(`${WALLET_B},${WALLET_A}`);
  });

  it("fails when the API names no owner for a wallet", async () => {
    const { ownersOfProfiles } = load();
    mockFetch.mockImplementation(async ({ endpoint }: { endpoint: string }) =>
      endpoint === "signed-records/owners"
        ? { anchor: 1, owners: [] }
        : { primary_wallet: WALLET_A }
    );
    await expect(ownersOfProfiles(["alice"])).rejects.toThrow(
      "did not name an owner"
    );
  });
});
