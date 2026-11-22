import { renderHook } from "@testing-library/react";
import {
  CompetitionSignatureError,
  getCompetitionSignatureFailureKey,
  useCompetitionSignature,
} from "@/hooks/competitions/useCompetitionSignature";
import { useAuth } from "@/components/auth/Auth";
const signMessageAsync = jest.fn().mockResolvedValue("0xsignature");
jest.mock("wagmi", () => ({ useSignMessage: () => ({ signMessageAsync }) }));
jest.mock("@/components/auth/Auth", () => ({ useAuth: jest.fn() }));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: "0xABC" }),
}));
jest.mock("@/contexts/CompetitionContext", () => ({
  useCompetition: () => ({
    competition: { id: "competition", wave_id: "wave", config_version: 2 },
  }),
}));

describe("competition wallet identity", () => {
  it("binds proxy actions to the represented profile while retaining the actual signing wallet", async () => {
    jest.mocked(useAuth).mockReturnValue({
      connectedProfile: { id: "delegate" },
      activeProfileProxy: { created_by: { id: "represented" } },
    } as ReturnType<typeof useAuth>);
    const { result } = renderHook(() => useCompetitionSignature());
    const signed = await result.current(
      "VOTE_SET",
      { value: 1 },
      "entry",
      "drop"
    );
    expect(JSON.parse(signed.message)).toMatchObject({
      actor_profile_id: "represented",
      actor_wallet: "0xabc",
      competition_id: "competition",
      competition_entry_id: "entry",
      config_version: 2,
    });
    expect(signMessageAsync).toHaveBeenCalledWith({ message: signed.message });
  });
  it("rejects signing after the authenticated profile is removed", async () => {
    jest.mocked(useAuth).mockReturnValue({
      connectedProfile: null,
      activeProfileProxy: null,
    } as ReturnType<typeof useAuth>);
    const { result } = renderHook(() => useCompetitionSignature());
    await expect(
      result.current("VOTE_SET", { value: 1 }, "entry", "drop")
    ).rejects.toThrow("A connected wallet is required");
  });
  it("tells a declined wallet signature apart from other wallet failures", async () => {
    jest.mocked(useAuth).mockReturnValue({
      connectedProfile: { id: "author" },
      activeProfileProxy: null,
    } as ReturnType<typeof useAuth>);
    const { result } = renderHook(() => useCompetitionSignature());
    signMessageAsync.mockRejectedValueOnce({ code: 4001 });
    const declined = await result
      .current("VOTE_SET", { value: 1 }, "entry", "drop")
      .catch((error: unknown) => error);
    expect(declined).toBeInstanceOf(CompetitionSignatureError);
    expect(getCompetitionSignatureFailureKey(declined)).toBe(
      "competitions.signatureCancelled"
    );
    signMessageAsync.mockRejectedValueOnce(new Error("Request expired"));
    const failed = await result
      .current("VOTE_SET", { value: 1 }, "entry", "drop")
      .catch((error: unknown) => error);
    expect(getCompetitionSignatureFailureKey(failed)).toBe(
      "competitions.signatureFailed"
    );
  });
  it("names a missing wallet connection as its own failure", async () => {
    jest.mocked(useAuth).mockReturnValue({
      connectedProfile: null,
      activeProfileProxy: null,
    } as ReturnType<typeof useAuth>);
    const { result } = renderHook(() => useCompetitionSignature());
    const error = await result
      .current("VOTE_SET", { value: 1 }, "entry", "drop")
      .catch((caught: unknown) => caught);
    expect(getCompetitionSignatureFailureKey(error)).toBe(
      "competitions.signatureWalletRequired"
    );
    expect(getCompetitionSignatureFailureKey(new Error("other"))).toBeNull();
  });
});
