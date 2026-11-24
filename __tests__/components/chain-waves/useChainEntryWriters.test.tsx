import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { WagmiContext } from "wagmi";
import { getAccount } from "wagmi/actions";
import {
  invalidateChainEntryQueries,
  useChainEntrySubmit,
  useChainEntryWriters,
} from "@/components/chain-waves/useChainEntryWriters";
import type { ApiCompetition } from "@/generated/models/ApiCompetition";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import { useChainWavesActive } from "@/hooks/useWavesMovePhase";
import {
  writeChainEntry,
  writeChainWithdrawal,
  type ChainWalletPrompt,
} from "@/lib/chain-waves/entryWriters";

const WALLET = "0x1111111111111111111111111111111111111111";
let mockProxy: object | null = null;
const mockSign = jest.fn();

jest.mock("@/hooks/useWavesMovePhase", () => ({
  useChainWavesActive: jest.fn(() => true),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ activeProfileProxy: mockProxy }),
}));
jest.mock("wagmi/actions", () => ({ getAccount: jest.fn() }));
jest.mock("@/hooks/competitions/useCompetitionSignature", () => ({
  useCompetitionSignatureFor: () => mockSign,
}));
jest.mock("@/lib/chain-waves/entryWriters", () => ({
  writeChainEntry: jest.fn(),
  writeChainWithdrawal: jest.fn(),
}));

const config = { chains: [] } as never;
const wrapper = ({ children }: { readonly children: ReactNode }) => (
  <WagmiContext.Provider value={config}>{children}</WagmiContext.Provider>
);

const request: ApiCreateDropRequest = {
  wave_id: "wave-1",
  drop_type: "PARTICIPATORY" as never,
  title: "Entry",
  parts: [{ content: "Hello", media: [] }],
  referenced_nfts: [],
  mentioned_users: [],
  metadata: [],
  signature: null,
  signer_address: WALLET,
  is_safe_signature: false,
};

const competition = (signatureRequired: boolean) =>
  ({
    id: "competition-1",
    wave_id: "wave-1",
    config_version: 5,
    participation: { signature_required: signatureRequired, terms: "Terms" },
  }) as ApiCompetition;

/** The consent callback the last writeChainEntry call got. */
const lastConsent = () =>
  jest.mocked(writeChainEntry).mock.calls.at(-1)?.[2].consent;
/** A wallet prompt that runs its ask; `mockPromptOpened` counts them. */
const mockPromptOpened = jest.fn();
const prompt: ChainWalletPrompt = (ask) => {
  mockPromptOpened();
  return ask();
};

beforeEach(() => {
  jest.clearAllMocks();
  mockProxy = null;
  jest.mocked(useChainWavesActive).mockReturnValue(true);
  jest.mocked(getAccount).mockReturnValue({ address: WALLET } as never);
  jest.mocked(writeChainEntry).mockResolvedValue({ entryId: "0x01" } as never);
});

describe("useChainEntryWriters", () => {
  it("is null before entries go to the 6529 Network", () => {
    jest.mocked(useChainWavesActive).mockReturnValue(false);
    const { result } = renderHook(() => useChainEntryWriters(), { wrapper });
    expect(result.current).toBeNull();
  });

  it("withdraws with the connected wallet", async () => {
    const { result } = renderHook(() => useChainEntryWriters(), { wrapper });
    await result.current?.withdrawEntry({ dropId: "drop-1" });
    expect(writeChainWithdrawal).toHaveBeenCalledWith(config, WALLET, {
      dropId: "drop-1",
    });
  });

  it("refuses a proxy", async () => {
    mockProxy = { id: "proxy" };
    const { result } = renderHook(() => useChainEntryWriters(), { wrapper });
    await expect(
      result.current?.withdrawEntry({ dropId: "drop-1" })
    ).rejects.toThrow("A proxy can't act on the 6529 Network.");
  });
});

describe("useChainEntrySubmit", () => {
  it("passes the chain_id the API gives the competition, and null without one", async () => {
    const chainId = `0x${"3c".repeat(32)}`;
    const { result, rerender } = renderHook(
      ({ value }: { value: ApiCompetition }) => useChainEntrySubmit(value),
      {
        wrapper,
        initialProps: {
          value: { ...competition(false), chain_id: chainId } as ApiCompetition,
        },
      }
    );
    await result.current?.({ request, terms: null });
    expect(writeChainEntry).toHaveBeenLastCalledWith(
      config,
      WALLET,
      expect.objectContaining({ competitionChainId: chainId })
    );
    rerender({ value: competition(false) });
    await result.current?.({ request, terms: null });
    expect(writeChainEntry).toHaveBeenLastCalledWith(
      config,
      WALLET,
      expect.objectContaining({ competitionChainId: null })
    );
  });

  it("has the wallet sign the competition's ENTRY_CREATE consent over the entry", async () => {
    mockSign.mockResolvedValue({
      message: JSON.stringify({ actor_wallet: WALLET }),
      signature: "0xsig",
    });
    const { result } = renderHook(
      () => useChainEntrySubmit(competition(true)),
      { wrapper }
    );
    await result.current?.({ request, terms: null });
    expect(writeChainEntry).toHaveBeenCalledWith(
      config,
      WALLET,
      expect.objectContaining({ request, competitionId: "competition-1" })
    );

    const consent = await lastConsent()?.({ title: "Entry" }, prompt);
    expect(mockPromptOpened).toHaveBeenCalledTimes(1);
    expect(mockSign).toHaveBeenCalledWith(
      "ENTRY_CREATE",
      { drop: { title: "Entry", signature: null }, drop_id: null },
      null,
      null
    );
    expect(consent).toMatchObject({
      scheme: "6529-competition-v1",
      terms: "Terms",
      config_version: 5,
      signer_address: WALLET,
      signature: "0xsig",
    });
  });

  it("asks no consent when the competition needs no signature", async () => {
    const { result } = renderHook(
      () => useChainEntrySubmit(competition(false)),
      { wrapper }
    );
    await result.current?.({ request, terms: null });
    await expect(lastConsent()?.({}, prompt)).resolves.toBeNull();
    expect(mockSign).not.toHaveBeenCalled();
    expect(mockPromptOpened).not.toHaveBeenCalled();
  });

  it("carries the composer's drop signature for a wave without a competition", async () => {
    const { result } = renderHook(() => useChainEntrySubmit(null), {
      wrapper,
    });
    await result.current?.({
      request: { ...request, signature: "0xdropsig" },
      terms: "Wave terms",
    });
    expect(writeChainEntry).toHaveBeenCalledWith(
      config,
      WALLET,
      expect.objectContaining({ competitionId: null })
    );
    await expect(lastConsent()?.({}, prompt)).resolves.toMatchObject({
      scheme: "6529-drop",
      terms: "Wave terms",
      signature: "0xdropsig",
    });
    expect(mockSign).not.toHaveBeenCalled();
    expect(mockPromptOpened).not.toHaveBeenCalled();
  });
});

describe("invalidateChainEntryQueries", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("refreshes now, and again once the index has likely read the block", async () => {
    jest.useFakeTimers();
    const client = {
      invalidateQueries: jest.fn().mockResolvedValue(undefined),
    };
    await invalidateChainEntryQueries(client as never, "wave-1");
    const now = client.invalidateQueries.mock.calls.length;
    expect(now).toBeGreaterThan(0);
    expect(client.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["DROPS_LEADERBOARD"],
    });
    jest.advanceTimersByTime(15_000);
    expect(client.invalidateQueries).toHaveBeenCalledTimes(now * 2);
  });
});
