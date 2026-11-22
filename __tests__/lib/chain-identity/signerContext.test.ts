import { setTestPublicEnv } from "@/__tests__/helpers/testPublicEnv";
import { chainGateway } from "@/lib/chain-identity/gateway";
import { signedInChainContext } from "@/lib/chain-identity/signerContext";
import { getWalletAddress } from "@/services/auth/auth.utils";

jest.mock("@/config/env", () => {
  const actual = jest.requireActual("@/config/env");
  return {
    ...actual,
    get publicEnv() {
      return {
        ...actual.publicEnv,
        ...(globalThis as { __testPublicEnv?: object }).__testPublicEnv,
      };
    },
  };
});
jest.mock("@/services/auth/auth.utils", () => ({
  getWalletAddress: jest.fn(),
}));
jest.mock("@/lib/chain-identity/gateway", () => ({
  ...jest.requireActual("@/lib/chain-identity/gateway"),
  chainGateway: { getIdentityByWalletFinalized: jest.fn() },
}));

const lookup = chainGateway.getIdentityByWalletFinalized as jest.Mock;
const WALLET = "0x00000000000000000000000000000000000000aa";
const PRINCIPAL = `0x${"AB".repeat(32)}`;

beforeEach(() => {
  jest.clearAllMocks();
  setTestPublicEnv({
    NEXT_PUBLIC_FEATURE_CHAIN_IDENTITY: "true",
    NEXT_PUBLIC_CHAIN_GATEWAY_URL: "https://gateway.example.test",
  });
  (getWalletAddress as jest.Mock).mockReturnValue(WALLET);
  lookup.mockResolvedValue({
    read: { height: 1200 },
    data: { principalId: PRINCIPAL },
  });
});

afterEach(() => setTestPublicEnv({}));

it("gives the signed-in wallet's principal and the finalized height", async () => {
  await expect(signedInChainContext()).resolves.toEqual({
    principal: PRINCIPAL.toLowerCase(),
    anchor: 1200,
  });
  expect(lookup).toHaveBeenCalledWith(WALLET, undefined);
});

it("gives nothing without chain flows, a signed-in wallet or an identity", async () => {
  lookup.mockResolvedValueOnce(null);
  await expect(signedInChainContext()).resolves.toBeNull();
  (getWalletAddress as jest.Mock).mockReturnValueOnce(null);
  await expect(signedInChainContext()).resolves.toBeNull();
  setTestPublicEnv({});
  await expect(signedInChainContext()).resolves.toBeNull();
  expect(lookup).toHaveBeenCalledTimes(1);
});

it("gives nothing for a malformed answer", async () => {
  lookup.mockResolvedValueOnce({ read: {}, data: { principalId: PRINCIPAL } });
  await expect(signedInChainContext()).resolves.toBeNull();
  lookup.mockResolvedValueOnce({ read: { height: 5 }, data: { principalId: "0x12" } });
  await expect(signedInChainContext()).resolves.toBeNull();
});
