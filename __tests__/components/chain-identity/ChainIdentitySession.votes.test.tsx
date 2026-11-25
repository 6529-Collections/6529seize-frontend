import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { Hex } from "viem";
import ChainIdentitySession from "@/components/chain-identity/ChainIdentitySession";
import { chainGateway } from "@/lib/chain-identity/gateway";
import { OP_VOTE_SET } from "@/lib/chain-identity/identityOps";

jest.mock("@/hooks/useWavesMovePhase", () => ({
  useChainWavesActive: () => true,
}));
jest.mock("@/lib/chain-identity/sessionKey", () => ({
  ...jest.requireActual("@/lib/chain-identity/sessionKey"),
  canHoldSessionKey: jest.fn().mockResolvedValue(true),
}));
jest.mock("@/lib/chain-identity/gateway", () => ({
  ...jest.requireActual("@/lib/chain-identity/gateway"),
  chainGateway: { getOps: jest.fn() },
}));

const getOps = chainGateway.getOps as jest.Mock;
const PRINCIPAL: Hex = `0x${"aa".repeat(32)}`;
const key = {
  principalId: PRINCIPAL,
  keyId: `0x${"01".repeat(32)}`,
  publicKeyHex: `0x${"02".repeat(32)}`,
  keyPair: {} as CryptoKeyPair,
  grantId: `0x${"03".repeat(32)}`,
  expiresAtMs: Date.UTC(2026, 11, 20),
} as const;

const renderSession = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(
    <ChainIdentitySession
      wallet={`0x${"11".repeat(20)}`}
      config={{} as never}
      principalId={PRINCIPAL}
      sessionKey={key}
      onChanged={jest.fn()}
    />,
    { wrapper }
  );
};

describe("ChainIdentitySession: adding votes to an older key", () => {
  it("offers to add votes once the chain runs VOTE_SET", async () => {
    getOps.mockResolvedValue({
      ruleVersion: 7,
      currencyAsset: `0x${"00".repeat(32)}`,
      ops: [{ opType: OP_VOTE_SET, name: "VOTE_SET" }],
    });
    renderSession();
    expect(
      await screen.findByRole("button", { name: "Add votes to this browser" })
    ).toBeInTheDocument();
  });

  it("doesn't offer it before then, since a new key would leave votes out again", async () => {
    getOps.mockResolvedValue({
      ruleVersion: 6,
      currencyAsset: `0x${"00".repeat(32)}`,
      ops: [],
    });
    renderSession();
    await waitFor(() => expect(getOps).toHaveBeenCalled());
    expect(
      screen.queryByRole("button", { name: "Add votes to this browser" })
    ).not.toBeInTheDocument();
  });
});
