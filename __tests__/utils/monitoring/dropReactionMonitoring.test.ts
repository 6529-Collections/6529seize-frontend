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

const mockSetExtras = jest.fn();

jest.mock("@sentry/nextjs", () => ({
  __esModule: true,
  addBreadcrumb: jest.fn(),
  withScope: jest.fn((callback: (scope: any) => void) => {
    const scope = {
      setLevel: jest.fn(),
      setFingerprint: jest.fn(),
      setTag: jest.fn(),
      setExtras: mockSetExtras,
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
    globalThis.history.pushState({}, "", "/");
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
          latency_bucket: "under_250ms",
        }),
      })
    );
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("preserves the authenticating websocket status in breadcrumbs", () => {
    beginReactionMutation({
      dropId: "drop-authenticating",
      waveId: "wave-1",
      source: "quick-react",
      action: "add",
      previousReaction: null,
      intendedReaction: ":smile:",
      optimisticReaction: ":smile:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.AUTHENTICATING,
    });

    expect(addBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "reaction.intent",
        data: expect.objectContaining({
          websocket_status: WebSocketStatus.AUTHENTICATING,
        }),
      })
    );
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
    expect(captureExceptionMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Drop reaction request failed" })
    );
    expect(addBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "reaction.rollback_applied",
      })
    );
  });

  it("breadcrumbs the exact proxy reaction permission denial without capturing it", () => {
    const mutation = beginReactionMutation({
      dropId: "drop-proxy",
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
      endpoint: "drops/drop-proxy/reaction",
      method: "POST",
    });

    const error = Object.assign(
      new Error("Proxy doesn't have permission to add reactions"),
      {
        name: "ApiError",
        status: 403,
        response: { status: 403 },
      }
    );

    dateNowSpy.mockReturnValue(1_200);
    const result = recordReactionRequestFailed(mutation, error);

    expect(result).toEqual({
      isLatestMutation: true,
      supersededByMutationId: null,
    });
    expect(addBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "reaction.proxy_permission_denied",
        data: expect.objectContaining({
          status_code: 403,
          error_kind: "auth",
          captured: false,
        }),
      })
    );
    expect(withScopeMock).not.toHaveBeenCalled();
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("breadcrumbs the exact disabled-wave capability 403 without capturing it", () => {
    const mutation = beginReactionMutation({
      dropId: "drop-disabled",
      waveId: "wave-1",
      source: "quick-react",
      action: "add",
      previousReaction: null,
      intendedReaction: ":smile:",
      optimisticReaction: ":smile:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    recordReactionRequestSent(mutation, {
      endpoint: "drops/drop-disabled/reaction",
      method: "POST",
    });

    const error = Object.assign(
      new Error("Chatting and reacting is not enabled in this wave"),
      {
        name: "ApiError",
        status: 403,
        response: { status: 403 },
      }
    );

    dateNowSpy.mockReturnValue(1_200);
    recordReactionRequestFailed(mutation, error);

    expect(addBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "reaction.wave_capability_disabled",
        data: expect.objectContaining({
          status_code: 403,
          error_kind: "auth",
          captured: false,
        }),
      })
    );
    expect(withScopeMock).not.toHaveBeenCalled();
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it.each([
    {
      caseName: "the disabled-wave message returned as 401",
      message: "Chatting and reacting is not enabled in this wave",
      status: 401,
    },
    {
      caseName: "a different disabled-wave 403 message",
      message: "Forbidden",
      status: 403,
    },
  ])("captures $caseName", ({ message, status }) => {
    const mutation = beginReactionMutation({
      dropId: "drop-disabled-unexpected",
      waveId: "wave-1",
      source: "quick-react",
      action: "add",
      previousReaction: null,
      intendedReaction: ":smile:",
      optimisticReaction: ":smile:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    recordReactionRequestSent(mutation, {
      endpoint: "drops/drop-disabled-unexpected/reaction",
      method: "POST",
    });

    const error = Object.assign(new Error(message), {
      name: "ApiError",
      status,
      response: { status },
    });

    dateNowSpy.mockReturnValue(1_200);
    recordReactionRequestFailed(mutation, error);

    expect(withScopeMock).toHaveBeenCalled();
    expect(captureExceptionMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Drop reaction request failed" })
    );
  });

  it.each([
    {
      caseName: "the same denial returned as 401",
      endpoint: "drops/drop-proxy/reaction",
      message: "Proxy doesn't have permission to add reactions",
      method: "POST",
      status: 401,
    },
    {
      caseName: "an unexpected 403 auth message",
      endpoint: "drops/drop-proxy/reaction",
      message: "Forbidden",
      method: "POST",
      status: 403,
    },
    {
      caseName: "the denial from a different endpoint",
      endpoint: "drops/another-drop/reaction",
      message: "Proxy doesn't have permission to add reactions",
      method: "POST",
      status: 403,
    },
    {
      caseName: "the denial on a remove request",
      endpoint: "drops/drop-proxy/reaction",
      message: "Proxy doesn't have permission to add reactions",
      method: "DELETE",
      status: 403,
    },
    {
      caseName: "the same message returned as a server error",
      endpoint: "drops/drop-proxy/reaction",
      message: "Proxy doesn't have permission to add reactions",
      method: "POST",
      status: 500,
    },
  ] as const)("captures $caseName", ({ endpoint, message, method, status }) => {
    const mutation = beginReactionMutation({
      dropId: "drop-proxy",
      waveId: "wave-1",
      source: "chip",
      action: "add",
      previousReaction: null,
      intendedReaction: ":smile:",
      optimisticReaction: ":smile:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    recordReactionRequestSent(mutation, { endpoint, method });

    const error = Object.assign(new Error(message), {
      name: "ApiError",
      status,
      response: { status },
    });

    dateNowSpy.mockReturnValue(1_200);
    recordReactionRequestFailed(mutation, error);

    expect(withScopeMock).toHaveBeenCalled();
    expect(captureExceptionMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Drop reaction request failed" })
    );
  });

  it("records rate-limit warning metadata without capturing an exception", () => {
    const mutation = beginReactionMutation({
      dropId: "drop-rate-limit",
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
      endpoint: "drops/drop-rate-limit/reaction",
      method: "POST",
    });

    const headers = new Headers({ "Retry-After": "2" });
    const error = Object.assign(new Error("Rate limit exceeded"), {
      status: 429,
      headers,
      response: {
        status: 429,
        headers,
      },
    });

    dateNowSpy.mockReturnValue(1_200);
    const result = recordReactionRequestFailed(mutation, error);

    expect(result).toEqual({
      isLatestMutation: true,
      supersededByMutationId: null,
    });
    expect(addBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "reaction.request_failed",
        data: expect.objectContaining({
          status_code: 429,
          error_kind: "rate-limit",
          retry_after_bucket: "1s_5s",
        }),
      })
    );
    expect(withScopeMock).not.toHaveBeenCalled();
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("breadcrumbs stale drop-not-found reaction failures without capturing an exception", () => {
    const mutation = beginReactionMutation({
      dropId: "drop-stale",
      waveId: "wave-1",
      source: "quick-react",
      action: "add",
      previousReaction: null,
      intendedReaction: ":smile:",
      optimisticReaction: ":smile:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    recordReactionRequestSent(mutation, {
      endpoint: "drops/drop-stale/reaction",
      method: "POST",
    });

    const error = Object.assign(new Error("Drop drop-stale not found"), {
      status: 404,
      response: {
        status: 404,
      },
    });

    dateNowSpy.mockReturnValue(1_200);
    const result = recordReactionRequestFailed(mutation, error);

    expect(result).toEqual({
      isLatestMutation: true,
      supersededByMutationId: null,
    });
    expect(addBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "reaction.request_failed",
        data: expect.objectContaining({
          status_code: 404,
          error_kind: "endpoint-contract",
        }),
      })
    );
    expect(addBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "reaction.stale_drop_not_found",
        data: expect.objectContaining({
          status_code: 404,
          error_kind: "endpoint-contract",
          captured: false,
        }),
      })
    );
    expect(withScopeMock).not.toHaveBeenCalled();
    expect(captureExceptionMock).not.toHaveBeenCalled();

    dateNowSpy.mockReturnValue(20_000);
    expect(
      recordReactionRealtimeReconciliation({
        drop: {
          id: "drop-stale",
          wave: { id: "wave-1" },
          context_profile_context: {
            reaction: null,
          } as any,
        },
        websocketStatus: WebSocketStatus.CONNECTED,
      })
    ).toEqual({
      shouldApplyCanonicalDrop: true,
      expectedReaction: null,
      serverReaction: null,
    });
  });

  it("captures non-matching endpoint-contract reaction failures", () => {
    const mutation = beginReactionMutation({
      dropId: "drop-contract",
      waveId: "wave-1",
      source: "quick-react",
      action: "add",
      previousReaction: null,
      intendedReaction: ":smile:",
      optimisticReaction: ":smile:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    recordReactionRequestSent(mutation, {
      endpoint: "drops/drop-contract/reaction",
      method: "POST",
    });

    const error = Object.assign(new Error("Reaction endpoint not found"), {
      status: 404,
      response: {
        status: 404,
      },
    });

    dateNowSpy.mockReturnValue(1_200);
    recordReactionRequestFailed(mutation, error);

    expect(withScopeMock).toHaveBeenCalled();
    expect(captureExceptionMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Drop reaction request failed" })
    );
  });

  it("breadcrumbs an older success as superseded without capturing an issue", () => {
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

    recordReactionRequestSent(olderMutation, {
      endpoint: "drops/drop-3/reaction",
      method: "POST",
    });

    dateNowSpy.mockReturnValue(1_350);
    const result = recordReactionRequestSucceeded(olderMutation);

    expect(addBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "reaction.response_superseded",
        data: expect.objectContaining({
          superseded: true,
        }),
      })
    );
    expect(result).toEqual({
      isLatestMutation: false,
      supersededByMutationId: newerMutation.mutationId,
    });
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("breadcrumbs an older failure as superseded without capturing a request failure", () => {
    const olderMutation = beginReactionMutation({
      dropId: "drop-3b",
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
      dropId: "drop-3b",
      waveId: "wave-1",
      source: "quick-react",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":smile:",
      optimisticReaction: ":smile:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    recordReactionRequestSent(olderMutation, {
      endpoint: "drops/drop-3b/reaction",
      method: "POST",
    });

    const networkError = new TypeError("Failed to fetch");

    dateNowSpy.mockReturnValue(1_350);
    const result = recordReactionRequestFailed(olderMutation, networkError);

    expect(addBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "reaction.response_superseded",
        data: expect.objectContaining({
          superseded: true,
        }),
      })
    );
    expect(addBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "reaction.request_failed",
        data: expect.objectContaining({
          error_kind: "network",
        }),
      })
    );
    expect(result).toEqual({
      isLatestMutation: false,
      supersededByMutationId: newerMutation.mutationId,
    });
    expect(withScopeMock).not.toHaveBeenCalled();
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("keeps older HTTP success stale after the latest failure clears the realtime guard", () => {
    const olderMutation = beginReactionMutation({
      dropId: "drop-3c",
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
      dropId: "drop-3c",
      waveId: "wave-1",
      source: "quick-react",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":smile:",
      optimisticReaction: ":smile:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    recordReactionRequestFailed(newerMutation, new TypeError("Failed"));
    const result = recordReactionRequestSucceeded(olderMutation);

    expect(result).toEqual({
      isLatestMutation: false,
      supersededByMutationId: newerMutation.mutationId,
    });
  });

  it("skips a stale realtime reaction update when a newer intent is active", () => {
    const olderMutation = beginReactionMutation({
      dropId: "drop-4-stale",
      waveId: "wave-1",
      source: "chip",
      action: "add",
      previousReaction: null,
      intendedReaction: ":wave:",
      optimisticReaction: ":wave:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    recordReactionRequestSent(olderMutation, {
      endpoint: "drops/drop-4-stale/reaction",
      method: "POST",
    });
    recordReactionRequestSucceeded(olderMutation);

    const newerMutation = beginReactionMutation({
      dropId: "drop-4-stale",
      waveId: "wave-1",
      source: "chip",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":smile:",
      optimisticReaction: ":smile:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    dateNowSpy.mockReturnValue(1_300);
    const result = recordReactionRealtimeReconciliation({
      drop: {
        id: "drop-4-stale",
        wave: { id: "wave-1" },
        context_profile_context: {
          reaction: ":wave:",
        } as any,
      },
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    expect(result).toEqual({
      shouldApplyCanonicalDrop: false,
      expectedReaction: ":smile:",
      serverReaction: ":wave:",
      supersededByMutationId: newerMutation.mutationId,
    });
    expect(addBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "reaction.realtime_superseded",
        data: expect.objectContaining({
          expected_reaction_present: true,
          server_reaction_present: true,
          server_matches_expected: false,
          superseded: true,
        }),
      })
    );
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("captures the production-shaped slow reconciliation mismatch", () => {
    const mutation = beginReactionMutation({
      dropId: "drop-4",
      waveId: "wave-1",
      source: "quick-react",
      action: "add",
      previousReaction: null,
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
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

    dateNowSpy.mockReturnValue(218_657);
    const result = recordReactionRealtimeReconciliation({
      drop: {
        id: "drop-4",
        wave: { id: "wave-1" },
        context_profile_context: {
          reaction: null,
        } as any,
      },
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    expect(result).toEqual({
      shouldApplyCanonicalDrop: true,
      expectedReaction: ":joy:",
      serverReaction: null,
    });
    expect(addBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "reaction.optimistic_reverted",
        data: expect.objectContaining({
          time_since_mutation_bucket: "over_15s",
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
    const result = recordReactionRealtimeReconciliation({
      drop: {
        id: "drop-5",
        wave: { id: "wave-1" },
        context_profile_context: {
          reaction: ":smile:",
        } as any,
      },
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    expect(result).toEqual({
      shouldApplyCanonicalDrop: true,
      expectedReaction: ":smile:",
      serverReaction: ":smile:",
    });
    expect(addBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "reaction.realtime_reconciled",
      })
    );
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("does not attribute a later canonical change to a reconciled mutation", () => {
    const mutation = beginReactionMutation({
      dropId: "drop-5-reconciled",
      waveId: "wave-1",
      source: "quick-react",
      action: "add",
      previousReaction: null,
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    recordReactionRequestSent(mutation, {
      endpoint: "drops/drop-5-reconciled/reaction",
      method: "POST",
    });

    dateNowSpy.mockReturnValue(1_100);
    recordReactionRequestSucceeded(mutation);

    dateNowSpy.mockReturnValue(1_300);
    recordReactionRealtimeReconciliation({
      drop: {
        id: "drop-5-reconciled",
        wave: { id: "wave-1" },
        context_profile_context: {
          reaction: ":joy:",
        } as any,
      },
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    addBreadcrumbMock.mockClear();
    dateNowSpy.mockReturnValue(218_657);
    const result = recordReactionRealtimeReconciliation({
      drop: {
        id: "drop-5-reconciled",
        wave: { id: "wave-1" },
        context_profile_context: {
          reaction: null,
        } as any,
      },
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    expect(result).toEqual({
      shouldApplyCanonicalDrop: true,
      expectedReaction: null,
      serverReaction: null,
    });
    expect(addBreadcrumbMock).not.toHaveBeenCalled();
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("keeps the realtime guard until the matching request succeeds", () => {
    const mutation = beginReactionMutation({
      dropId: "drop-5-pending",
      waveId: "wave-1",
      source: "quick-react",
      action: "add",
      previousReaction: null,
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    recordReactionRequestSent(mutation, {
      endpoint: "drops/drop-5-pending/reaction",
      method: "POST",
    });

    dateNowSpy.mockReturnValue(1_200);
    recordReactionRealtimeReconciliation({
      drop: {
        id: "drop-5-pending",
        wave: { id: "wave-1" },
        context_profile_context: {
          reaction: ":joy:",
        } as any,
      },
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    dateNowSpy.mockReturnValue(1_300);
    const staleResult = recordReactionRealtimeReconciliation({
      drop: {
        id: "drop-5-pending",
        wave: { id: "wave-1" },
        context_profile_context: {
          reaction: null,
        } as any,
      },
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    expect(staleResult).toEqual({
      shouldApplyCanonicalDrop: false,
      expectedReaction: ":joy:",
      serverReaction: null,
      supersededByMutationId: mutation.mutationId,
    });
    expect(captureExceptionMock).not.toHaveBeenCalled();

    dateNowSpy.mockReturnValue(1_400);
    recordReactionRequestSucceeded(mutation);

    addBreadcrumbMock.mockClear();
    dateNowSpy.mockReturnValue(1_500);
    const laterResult = recordReactionRealtimeReconciliation({
      drop: {
        id: "drop-5-pending",
        wave: { id: "wave-1" },
        context_profile_context: {
          reaction: null,
        } as any,
      },
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    expect(laterResult).toEqual({
      shouldApplyCanonicalDrop: true,
      expectedReaction: null,
      serverReaction: null,
    });
    expect(addBreadcrumbMock).not.toHaveBeenCalled();
    expect(captureExceptionMock).not.toHaveBeenCalled();
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

  it("keeps Sentry payloads bounded and free of reaction identifiers", () => {
    globalThis.history.pushState({}, "", "/private-handle/rep");
    const mutation = beginReactionMutation({
      dropId: "private-drop-id",
      waveId: "private-wave-id",
      source: "picker",
      action: "replace",
      previousReaction: ":private-old-reaction:",
      intendedReaction: ":private-new-reaction:",
      optimisticReaction: ":private-new-reaction:",
      profileId: "private-profile-id",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    recordReactionRequestSent(mutation, {
      endpoint: "drops/private-drop-id/reaction",
      method: "POST",
    });
    recordReactionRequestFailed(
      mutation,
      new Error("private-drop-id failed for private-profile-id")
    );

    expect(addBreadcrumbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          endpoint_family: "drop_reaction",
          has_profile_context: true,
          route_family: "/[user]/[...cmsPath]",
        }),
      })
    );
    expect(mockSetExtras).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint_family: "drop_reaction",
        intended_reaction_present: true,
        optimistic_matches_intended: true,
        route_family: "/[user]/[...cmsPath]",
      })
    );

    const sentryPayload = JSON.stringify({
      breadcrumbs: addBreadcrumbMock.mock.calls,
      exceptions: captureExceptionMock.mock.calls,
      extras: mockSetExtras.mock.calls,
    });
    for (const privateValue of [
      "private-drop-id",
      "private-wave-id",
      "private-profile-id",
      ":private-old-reaction:",
      ":private-new-reaction:",
      "/private-handle/rep",
      "drops/private-drop-id/reaction",
    ]) {
      expect(sentryPayload).not.toContain(privateValue);
    }

    const sentryData = [
      ...addBreadcrumbMock.mock.calls.map(
        (call) =>
          (call[0] as { readonly data?: Record<string, unknown> }).data ?? {}
      ),
      ...mockSetExtras.mock.calls.map(
        (call) => call[0] as Record<string, unknown>
      ),
    ];
    for (const removedKey of [
      "mutation_id",
      "drop_id",
      "wave_id",
      "profile_id",
      "previous_reaction",
      "intended_reaction",
      "optimistic_reaction",
      "pathname",
      "endpoint",
      "error_message",
    ]) {
      for (const data of sentryData) {
        expect(data).not.toHaveProperty(removedKey);
      }
    }
  });

  it("keeps reaction behavior non-blocking when Sentry throws", () => {
    addBreadcrumbMock.mockImplementationOnce(() => {
      throw new Error("Breadcrumb transport unavailable");
    });

    expect(() =>
      beginReactionMutation({
        dropId: "drop-non-blocking",
        waveId: "wave-1",
        source: "quick-react",
        action: "add",
        previousReaction: null,
        intendedReaction: ":smile:",
        optimisticReaction: ":smile:",
        profileId: "profile-1",
        websocketStatus: WebSocketStatus.CONNECTED,
      })
    ).not.toThrow();

    const mutation = beginReactionMutation({
      dropId: "drop-capture-non-blocking",
      waveId: "wave-1",
      source: "quick-react",
      action: "add",
      previousReaction: null,
      intendedReaction: ":smile:",
      optimisticReaction: ":smile:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });
    withScopeMock.mockImplementationOnce(() => {
      throw new Error("Sentry scope unavailable");
    });

    expect(() =>
      recordReactionRequestFailed(mutation, new TypeError("Failed to fetch"))
    ).not.toThrow();
  });

  it("does not let a stale failure consume the latest failure capture", () => {
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

    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    expect(captureExceptionMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Drop reaction request failed" })
    );
  });
});
