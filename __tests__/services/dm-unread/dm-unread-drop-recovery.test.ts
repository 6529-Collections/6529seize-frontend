import { QueryClient } from "@tanstack/react-query";
import { DmDropRecoveryPolicy } from "@/services/dm-unread/dm-unread-drop-recovery";

const GRACE_MS = 1_500;

const delay = (
  policy: DmDropRecoveryPolicy,
  waveId: string,
  {
    isDirectMessage,
    hasConversation = false,
    queryClient,
  }: {
    readonly isDirectMessage?: boolean;
    readonly hasConversation?: boolean;
    readonly queryClient?: QueryClient;
  } = {}
) => policy.getDelay({ waveId, isDirectMessage, hasConversation, queryClient });

describe("DmDropRecoveryPolicy", () => {
  it("follows a frame's direct-message flag", () => {
    const policy = new DmDropRecoveryPolicy();
    expect(delay(policy, "dm", { isDirectMessage: true })).toBe(GRACE_MS);
    expect(delay(policy, "public", { isDirectMessage: false })).toBeNull();
    // Even when the snapshot already has a conversation for it.
    expect(
      delay(policy, "public", { isDirectMessage: false, hasConversation: true })
    ).toBeNull();
  });

  it("checks a stored conversation soon and an unknown wave late", () => {
    const policy = new DmDropRecoveryPolicy();
    expect(delay(policy, "dm", { hasConversation: true })).toBe(GRACE_MS);
    const unknown = delay(policy, "unknown");
    expect(unknown).toBeGreaterThanOrEqual(7_500);
    expect(unknown).toBeLessThanOrEqual(22_500);
  });

  it("scans the caches once per wave and remembers what it found", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(["WAVES_V2", { list: "all" }], {
      pages: [
        {
          waves: [
            { id: "listed", isDirectMessage: false },
            { id: "listed-dm", isDirectMessage: true },
          ],
        },
      ],
      pageParams: [1],
    });
    const scan = jest.spyOn(queryClient, "getQueriesData");
    const policy = new DmDropRecoveryPolicy();

    expect(delay(policy, "listed", { queryClient })).toBeNull();
    expect(delay(policy, "listed", { queryClient })).toBeNull();
    expect(delay(policy, "listed-dm", { queryClient })).toBe(GRACE_MS);
    expect(scan).toHaveBeenCalledTimes(2);
    queryClient.clear();
  });

  it("reads the wave cache before the lists", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(["WAVE", { wave_id: "open" }], {
      id: "open",
      chat: { scope: { group: null } },
    });
    const policy = new DmDropRecoveryPolicy();
    expect(delay(policy, "open", { queryClient })).toBeNull();
    queryClient.clear();
  });

  it("forgets the least recently seen wave first", () => {
    const policy = new DmDropRecoveryPolicy();
    for (let index = 0; index < 1_000; index++) {
      delay(policy, `wave-${index}`, { isDirectMessage: false });
    }
    // Seeing wave-0 again makes wave-1 the least recent.
    expect(delay(policy, "wave-0")).toBeNull();
    delay(policy, "wave-1000", { isDirectMessage: false });

    expect(delay(policy, "wave-0")).toBeNull();
    expect(delay(policy, "wave-2")).toBeNull();
    expect(delay(policy, "wave-1")).toBeGreaterThanOrEqual(7_500);
  });
});
