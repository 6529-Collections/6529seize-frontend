import * as Sentry from "@sentry/nextjs";
import {
  __resetDropReactionMonitoringForTests,
  beginReactionMutation,
  deriveReactionAction,
  getProtectedReactionIntent,
  recordReactionOptimisticApplied,
  recordReactionRealtimeReconciliation,
  recordReactionRequestFailed,
  recordReactionRequestSent,
  recordReactionRequestSucceeded,
  recordReactionRollbackApplied,
} from "@/utils/monitoring/dropReactionMonitoring";
import { WebSocketStatus } from "@/services/websocket/WebSocketTypes";

jest.mock("@sentry/nextjs", () => ({
  __esModule: true,
  addBreadcrumb: jest.fn(),
  withScope: jest.fn((callback: (scope: any) => void) => {
    const scope = {
      setLevel: jest.fn(),
      setFingerprint: jest.fn(),
      setTag: jest.fn(),
      setExtras: jest.fn(),
    };
    callback(scope);
  }),
  captureException: jest.fn(),
}));

describe("dropReactionMonitoring", () => {
  const addBreadcrumbMock = Sentry.addBreadcrumb as jest.Mock;
  const withScopeMock = Sentry.withScope as jest.Mock;
  const captureExceptionMock = Sentry.captureException as jest.Mock;
  let dateNowSpy: jest.SpyInstance<number, []>;

  beforeEach(() => {
    jest.clearAllMocks();
    __resetDropReactionMonitoringForTests();
    dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("derives reaction actions correctly", () => {
    expect(deriveReactionAction(null, ":smile:")).toBe("add");
    expect(deriveReactionAction(":wave:", null)).toBe("remove");
    expect(deriveReactionAction(":wave:", ":smile:")).toBe("replace");
  });

  it("records breadcrumbs for a successful reaction request", () => {
    const mutation = beginReactionMutation({
      dropId: "drop-1",
      waveId: "wave-1",
      source: "quick-react",
      action: "add",
      previousReaction: null,
      intendedReaction: ":smile:",
      optimisticReaction: ":smile:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    dateNowSpy.mockReturnValue(1_100);
    recordReactionOptimisticApplied(mutation);
    recordReactionRequestSent(mutation, {
      endpoint: "drops/drop-1/reaction",
      method: "POST",
    });

    dateNowSpy.mockReturnValue(1_250);
    recordReactionRequestSucceeded(mutation);

    expect(addBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "reaction.intent",
      })
    );
    expect(addBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "reaction.optimistic_applied",
      })
    );
    expect(addBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "reaction.request_sent",
      })
    );
    expect(addBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "reaction.request_succeeded",
        data: expect.objectContaining({
          latency_ms: 150,
        }),
      })
    );
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("captures a classified failure event for auth errors", () => {
    const mutation = beginReactionMutation({
      dropId: "drop-2",
      waveId: "wave-1",
      source: "picker",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":smile:",
      optimisticReaction: ":smile:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    recordReactionRequestSent(mutation, {
      endpoint: "drops/drop-2/reaction",
      method: "POST",
    });

    const error = Object.assign(new Error("Unauthorized"), {
      status: 401,
    });

    dateNowSpy.mockReturnValue(1_200);
    recordReactionRequestFailed(mutation, error);
    recordReactionRollbackApplied(mutation);

    expect(addBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "reaction.request_failed",
        data: expect.objectContaining({
          status_code: 401,
          error_kind: "auth",
        }),
      })
    );
    expect(withScopeMock).toHaveBeenCalled();
    expect(captureExceptionMock).toHaveBeenCalledWith(error);
    expect(addBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "reaction.rollback_applied",
      })
    );
  });

  it("captures an out-of-order anomaly when an older mutation resolves last", () => {
    const olderMutation = beginReactionMutation({
      dropId: "drop-3",
      waveId: "wave-1",
      source: "quick-react",
      action: "add",
      previousReaction: null,
      intendedReaction: ":wave:",
      optimisticReaction: ":wave:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    const newerMutation = beginReactionMutation({
      dropId: "drop-3",
      waveId: "wave-1",
      source: "quick-react",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":smile:",
      optimisticReaction: ":smile:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    void newerMutation;

    recordReactionRequestSent(olderMutation, {
      endpoint: "drops/drop-3/reaction",
      method: "POST",
    });

    dateNowSpy.mockReturnValue(1_350);
    recordReactionRequestSucceeded(olderMutation);

    expect(addBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "reaction.response_superseded",
        data: expect.objectContaining({
          superseded_by_mutation_id: expect.any(String),
        }),
      })
    );
    expect(captureExceptionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Reaction response superseded by newer mutation",
      })
    );
  });

  it("captures reconciliation mismatch after success when failure timestamp is null", () => {
    const mutation = beginReactionMutation({
      dropId: "drop-4",
      waveId: "wave-1",
      source: "chip",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":smile:",
      optimisticReaction: ":smile:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    recordReactionRequestSent(mutation, {
      endpoint: "drops/drop-4/reaction",
      method: "POST",
    });

    dateNowSpy.mockReturnValue(1_100);
    recordReactionRequestSucceeded(mutation);
    expect(mutation.apiFailedAt).toBeNull();

    dateNowSpy.mockReturnValue(6_101);
    recordReactionRealtimeReconciliation({
      drop: {
        id: "drop-4",
        wave: { id: "wave-1" },
        context_profile_context: {
          reaction: ":wave:",
        } as any,
      },
      activeProfileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    expect(addBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "reaction.optimistic_reverted",
        data: expect.objectContaining({
          server_reaction: ":wave:",
        }),
      })
    );
    expect(captureExceptionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Reaction optimistic state disagreed with canonical state",
      })
    );
  });

  it("does not record reconciliation logs for a different active profile", () => {
    const mutation = beginReactionMutation({
      dropId: "drop-profile-mismatch",
      waveId: "wave-1",
      source: "chip",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":smile:",
      optimisticReaction: ":smile:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    recordReactionRequestSent(mutation, {
      endpoint: "drops/drop-profile-mismatch/reaction",
      method: "POST",
    });

    dateNowSpy.mockReturnValue(1_100);
    recordReactionRequestSucceeded(mutation);
    jest.clearAllMocks();

    dateNowSpy.mockReturnValue(6_101);
    recordReactionRealtimeReconciliation({
      drop: {
        id: "drop-profile-mismatch",
        wave: { id: "wave-1" },
        context_profile_context: {
          reaction: ":wave:",
        } as any,
      },
      activeProfileId: "profile-2",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    expect(addBreadcrumbMock).not.toHaveBeenCalled();
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("ignores reconciliation mismatch after the reconciliation window", () => {
    const mutation = beginReactionMutation({
      dropId: "drop-late-mismatch",
      waveId: "wave-1",
      source: "chip",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":smile:",
      optimisticReaction: ":smile:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    recordReactionRequestSent(mutation, {
      endpoint: "drops/drop-late-mismatch/reaction",
      method: "POST",
    });

    dateNowSpy.mockReturnValue(1_100);
    recordReactionRequestSucceeded(mutation);

    dateNowSpy.mockReturnValue(16_001);
    recordReactionRealtimeReconciliation({
      drop: {
        id: "drop-late-mismatch",
        wave: { id: "wave-1" },
        context_profile_context: {
          reaction: ":wave:",
        } as any,
      },
      activeProfileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    expect(addBreadcrumbMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        message: "reaction.optimistic_reverted",
      })
    );
    expect(captureExceptionMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Reaction optimistic state disagreed with canonical state",
      })
    );
  });

  it("adds a breadcrumb only when realtime reconciliation matches intent", () => {
    const mutation = beginReactionMutation({
      dropId: "drop-5",
      waveId: "wave-1",
      source: "chip",
      action: "add",
      previousReaction: null,
      intendedReaction: ":smile:",
      optimisticReaction: ":smile:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    recordReactionRequestSent(mutation, {
      endpoint: "drops/drop-5/reaction",
      method: "POST",
    });

    dateNowSpy.mockReturnValue(1_100);
    recordReactionRequestSucceeded(mutation);

    dateNowSpy.mockReturnValue(1_300);
    recordReactionRealtimeReconciliation({
      drop: {
        id: "drop-5",
        wave: { id: "wave-1" },
        context_profile_context: {
          reaction: ":smile:",
        } as any,
      },
      activeProfileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    expect(addBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "reaction.realtime_reconciled",
      })
    );
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("does not add a matched reconciliation breadcrumb after the reconciliation window", () => {
    const mutation = beginReactionMutation({
      dropId: "drop-late-match",
      waveId: "wave-1",
      source: "chip",
      action: "add",
      previousReaction: null,
      intendedReaction: ":smile:",
      optimisticReaction: ":smile:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    recordReactionRequestSent(mutation, {
      endpoint: "drops/drop-late-match/reaction",
      method: "POST",
    });

    dateNowSpy.mockReturnValue(1_100);
    recordReactionRequestSucceeded(mutation);

    dateNowSpy.mockReturnValue(16_001);
    recordReactionRealtimeReconciliation({
      drop: {
        id: "drop-late-match",
        wave: { id: "wave-1" },
        context_profile_context: {
          reaction: ":smile:",
        } as any,
      },
      activeProfileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    expect(addBreadcrumbMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        message: "reaction.realtime_reconciled",
      })
    );
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("returns protected intent for the latest in-flight mutation", () => {
    const mutation = beginReactionMutation({
      dropId: "drop-protected-1",
      waveId: "wave-1",
      source: "quick-react",
      action: "add",
      previousReaction: null,
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    dateNowSpy.mockReturnValue(2_000);

    expect(getProtectedReactionIntent("drop-protected-1", "profile-1")).toEqual(
      expect.objectContaining({
        mutationId: mutation.mutationId,
        dropMutationSeq: 1,
        reaction: ":joy:",
        profileId: "profile-1",
        apiSucceededAt: null,
      })
    );
  });

  it("returns protected intent for five seconds after success", () => {
    const mutation = beginReactionMutation({
      dropId: "drop-protected-2",
      waveId: "wave-1",
      source: "picker",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    dateNowSpy.mockReturnValue(1_100);
    recordReactionRequestSucceeded(mutation);

    dateNowSpy.mockReturnValue(6_100);

    expect(getProtectedReactionIntent("drop-protected-2", "profile-1")).toEqual(
      expect.objectContaining({
        mutationId: mutation.mutationId,
        reaction: ":joy:",
        profileId: "profile-1",
        apiSucceededAt: 1_100,
      })
    );
  });

  it("returns null after the five second success protection window", () => {
    const mutation = beginReactionMutation({
      dropId: "drop-protected-3",
      waveId: "wave-1",
      source: "picker",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    dateNowSpy.mockReturnValue(1_100);
    recordReactionRequestSucceeded(mutation);

    dateNowSpy.mockReturnValue(6_101);

    expect(
      getProtectedReactionIntent("drop-protected-3", "profile-1")
    ).toBeNull();
  });

  it("returns null for a failed mutation", () => {
    const mutation = beginReactionMutation({
      dropId: "drop-protected-4",
      waveId: "wave-1",
      source: "picker",
      action: "add",
      previousReaction: null,
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    dateNowSpy.mockReturnValue(1_100);
    recordReactionRequestFailed(mutation, new TypeError("Failed to fetch"));

    dateNowSpy.mockReturnValue(1_200);

    expect(
      getProtectedReactionIntent("drop-protected-4", "profile-1")
    ).toBeNull();
  });

  it("returns null for a different active profile", () => {
    beginReactionMutation({
      dropId: "drop-protected-different-profile",
      waveId: "wave-1",
      source: "quick-react",
      action: "add",
      previousReaction: null,
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    dateNowSpy.mockReturnValue(2_000);

    expect(
      getProtectedReactionIntent(
        "drop-protected-different-profile",
        "profile-2"
      )
    ).toBeNull();
  });

  it("returns null for anonymous active profile state", () => {
    beginReactionMutation({
      dropId: "drop-protected-anonymous",
      waveId: "wave-1",
      source: "quick-react",
      action: "add",
      previousReaction: null,
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    dateNowSpy.mockReturnValue(2_000);

    expect(
      getProtectedReactionIntent("drop-protected-anonymous", null)
    ).toBeNull();
  });

  it("uses the newest mutation as the protected intent for a drop", () => {
    beginReactionMutation({
      dropId: "drop-protected-5",
      waveId: "wave-1",
      source: "quick-react",
      action: "add",
      previousReaction: null,
      intendedReaction: ":wave:",
      optimisticReaction: ":wave:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    dateNowSpy.mockReturnValue(1_050);
    const newerMutation = beginReactionMutation({
      dropId: "drop-protected-5",
      waveId: "wave-1",
      source: "quick-react",
      action: "remove",
      previousReaction: ":wave:",
      intendedReaction: null,
      optimisticReaction: null,
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    dateNowSpy.mockReturnValue(1_100);

    expect(getProtectedReactionIntent("drop-protected-5", "profile-1")).toEqual(
      expect.objectContaining({
        mutationId: newerMutation.mutationId,
        dropMutationSeq: 2,
        reaction: null,
        profileId: "profile-1",
      })
    );
  });

  it("resets the per-drop sequence when the last tracked mutation ages out", () => {
    const firstMutation = beginReactionMutation({
      dropId: "drop-6",
      waveId: "wave-1",
      source: "picker",
      action: "add",
      previousReaction: null,
      intendedReaction: ":smile:",
      optimisticReaction: ":smile:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    dateNowSpy.mockReturnValue(302_000);
    const nextMutation = beginReactionMutation({
      dropId: "drop-6",
      waveId: "wave-1",
      source: "picker",
      action: "replace",
      previousReaction: ":smile:",
      intendedReaction: ":wave:",
      optimisticReaction: ":wave:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    expect(firstMutation.dropMutationSeq).toBe(1);
    expect(nextMutation.dropMutationSeq).toBe(1);
  });

  it("keeps the per-drop sequence while a newer mutation is still tracked", () => {
    const oldestMutation = beginReactionMutation({
      dropId: "drop-7",
      waveId: "wave-1",
      source: "picker",
      action: "add",
      previousReaction: null,
      intendedReaction: ":smile:",
      optimisticReaction: ":smile:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    dateNowSpy.mockReturnValue(150_000);
    const newerMutation = beginReactionMutation({
      dropId: "drop-7",
      waveId: "wave-1",
      source: "picker",
      action: "replace",
      previousReaction: ":smile:",
      intendedReaction: ":wave:",
      optimisticReaction: ":wave:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    dateNowSpy.mockReturnValue(302_000);
    const latestMutation = beginReactionMutation({
      dropId: "drop-7",
      waveId: "wave-1",
      source: "picker",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":fire:",
      optimisticReaction: ":fire:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    expect(oldestMutation.dropMutationSeq).toBe(1);
    expect(newerMutation.dropMutationSeq).toBe(2);
    expect(latestMutation.dropMutationSeq).toBe(3);
  });

  it("dedupes repeated identical failure events within 60 seconds", () => {
    const firstMutation = beginReactionMutation({
      dropId: "drop-8",
      waveId: "wave-1",
      source: "picker",
      action: "add",
      previousReaction: null,
      intendedReaction: ":smile:",
      optimisticReaction: ":smile:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });
    recordReactionRequestSent(firstMutation, {
      endpoint: "drops/drop-8/reaction",
      method: "POST",
    });

    const secondMutation = beginReactionMutation({
      dropId: "drop-8",
      waveId: "wave-1",
      source: "picker",
      action: "add",
      previousReaction: null,
      intendedReaction: ":smile:",
      optimisticReaction: ":smile:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });
    recordReactionRequestSent(secondMutation, {
      endpoint: "drops/drop-8/reaction",
      method: "POST",
    });

    const networkError = new TypeError("Failed to fetch");

    dateNowSpy.mockReturnValue(1_100);
    recordReactionRequestFailed(firstMutation, networkError);
    dateNowSpy.mockReturnValue(1_200);
    recordReactionRequestFailed(secondMutation, networkError);

    expect(captureExceptionMock).toHaveBeenCalledTimes(2);
    expect(captureExceptionMock.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        message: "Reaction response superseded by newer mutation",
      })
    );
    expect(captureExceptionMock.mock.calls[1]?.[0]).toBe(networkError);
  });
});
