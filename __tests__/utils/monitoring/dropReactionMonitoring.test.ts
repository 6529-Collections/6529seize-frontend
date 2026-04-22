import * as Sentry from "@sentry/nextjs";
import {
  __resetDropReactionMonitoringForTests,
  beginReactionMutation,
  deriveReactionAction,
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

    dateNowSpy.mockReturnValue(1_500);
    recordReactionRealtimeReconciliation({
      drop: {
        id: "drop-4",
        wave: { id: "wave-1" },
        context_profile_context: {
          reaction: ":wave:",
        } as any,
      },
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
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    expect(addBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "reaction.realtime_reconciled",
      })
    );
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("dedupes repeated identical failure events within 60 seconds", () => {
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
    recordReactionRequestSent(firstMutation, {
      endpoint: "drops/drop-6/reaction",
      method: "POST",
    });

    const secondMutation = beginReactionMutation({
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
    recordReactionRequestSent(secondMutation, {
      endpoint: "drops/drop-6/reaction",
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
