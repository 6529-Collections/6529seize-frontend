import { useDropReaction } from "@/hooks/drops/useDropReaction";
import { rollbackRejectedReactionInCachedDrops } from "@/components/react-query-wrapper/utils/updateAttachmentInCachedDrops";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { useAuth } from "@/components/auth/Auth";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import * as commonApi from "@/services/api/common-api";
import * as dropReactionMonitoring from "@/utils/monitoring/dropReactionMonitoring";
import { act, renderHook } from "@testing-library/react";

const setToastMock = jest.fn();
const rollbackMock = jest.fn();
const applyOptimisticDropUpdateMock = jest.fn(() => ({
  rollback: rollbackMock,
}));
const mockQueryClient = {
  getQueryCache: jest.fn(() => ({
    findAll: jest.fn(() => []),
  })),
  setQueryData: jest.fn(),
  setQueriesData: jest.fn(),
};

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: jest.fn(() => mockQueryClient),
}));

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
  commonApiDelete: jest.fn(),
}));

jest.mock("@/helpers/reactions/reactionHistory", () => ({
  recordReaction: jest.fn(),
}));

jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebsocketStatus: jest.fn(() => "connected"),
}));

jest.mock(
  "@/components/react-query-wrapper/utils/updateAttachmentInCachedDrops",
  () => ({
    rollbackRejectedReactionInCachedDrops: jest.fn(),
  })
);

jest.mock("@/utils/monitoring/dropReactionMonitoring", () => ({
  beginReactionMutation: jest.fn(() => ({
    mutationId: "mutation-1",
    dropId: "drop-1",
  })),
  deriveReactionAction: jest.fn(() => "add"),
  isLatestReactionMutation: jest.fn(() => true),
  recordReactionOptimisticApplied: jest.fn(),
  recordReactionRequestFailed: jest.fn(),
  recordReactionRequestSent: jest.fn(),
  recordReactionRequestSucceeded: jest.fn(),
  recordReactionRollbackApplied: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;
const mockUseMyStream = useMyStream as jest.Mock;
const createStructuredReactionError = ({
  body,
  message = "technical error",
  status,
}: {
  body?: unknown;
  message?: string;
  status?: number;
}): Error & {
  status?: number;
  response: { body?: unknown; status?: number };
} =>
  Object.assign(new Error(message), {
    ...(status !== undefined ? { status } : {}),
    response: {
      ...(body !== undefined ? { body } : {}),
      ...(status !== undefined ? { status } : {}),
    },
  });

const mockDrop = {
  id: "drop-1",
  wave: { id: "wave-1" },
  context_profile_context: { reaction: null },
  author: { handle: "author-handle" },
  parts: [],
  metadata: [],
  drop_type: ApiDropType.Standard,
  serial_no: 1,
  created_at: new Date().toISOString(),
  reply_to: null,
  wave_messages: [],
  reactions: [],
  type: DropSize.FULL,
  stableKey: "drop-1",
  stableHash: "hash-drop-1",
} as unknown as ExtendedDrop;

describe("useDropReaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      setToast: setToastMock,
      connectedProfile: {
        id: "identity-1",
        handle: "user",
        pfp: null,
        banner1: null,
        banner2: null,
        cic: 0,
        rep: 0,
        tdh: 0,
        tdh_rate: 0,
        xtdh: 0,
        xtdh_rate: 0,
        level: 0,
        primary_wallet: "0xuser",
        active_main_stage_submission_ids: [],
        winner_main_stage_drop_ids: [],
        is_wave_creator: false,
        artist_of_prevote_cards: [],
        profile_wave_id: null,
      },
    });
    mockUseMyStream.mockReturnValue({
      applyOptimisticDropUpdate: applyOptimisticDropUpdateMock,
    });
  });

  it("shows structured API error messages for quick react failures", async () => {
    (commonApi.commonApiPost as jest.Mock).mockRejectedValueOnce(
      createStructuredReactionError({
        body: JSON.stringify({ error: "Rate limited" }),
        message: "unexpected raw error",
        status: 429,
      })
    );

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    await act(async () => {
      await result.current.react(":smile:");
    });

    expect(commonApi.commonApiPost).toHaveBeenCalledWith({
      endpoint: "drops/drop-1/reaction",
      body: { reaction: ":smile:" },
      errorMode: "structured",
    });
    expect(setToastMock).toHaveBeenCalledWith({
      message: "Rate limited",
      type: "error",
    });
  });

  it("rolls back cached drop queries for latest quick react failures", async () => {
    (commonApi.commonApiPost as jest.Mock).mockRejectedValueOnce(
      createStructuredReactionError({
        message: "network failed",
        status: 503,
      })
    );

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    await act(async () => {
      await result.current.react(":smile:");
    });

    expect(rollbackRejectedReactionInCachedDrops).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        dropId: "drop-1",
        failedReaction: ":smile:",
        previousReaction: null,
        profile: expect.objectContaining({
          id: "identity-1",
          handle: "user",
        }),
      })
    );
  });

  it("uses the primary wallet as the mutation profile id when identity id is missing", async () => {
    mockUseAuth.mockReturnValue({
      setToast: setToastMock,
      connectedProfile: {
        id: null,
        handle: "user",
        pfp: null,
        banner1: null,
        banner2: null,
        cic: 0,
        rep: 0,
        tdh: 0,
        tdh_rate: 0,
        xtdh: 0,
        xtdh_rate: 0,
        level: 0,
        primary_wallet: "0xuser",
        active_main_stage_submission_ids: [],
        winner_main_stage_drop_ids: [],
        is_wave_creator: false,
        artist_of_prevote_cards: [],
        profile_wave_id: null,
      },
    });
    (commonApi.commonApiPost as jest.Mock).mockResolvedValueOnce({});

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    await act(async () => {
      await result.current.react(":smile:");
    });

    expect(dropReactionMonitoring.beginReactionMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        profileId: "0xuser",
        profile: expect.objectContaining({
          id: "0xuser",
        }),
      })
    );
  });

  it("does not roll back cached drop queries for superseded quick react failures", async () => {
    (
      dropReactionMonitoring.isLatestReactionMutation as jest.Mock
    ).mockReturnValueOnce(false);
    (commonApi.commonApiPost as jest.Mock).mockRejectedValueOnce(
      createStructuredReactionError({
        message: "network failed",
        status: 503,
      })
    );

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    await act(async () => {
      await result.current.react(":smile:");
    });

    expect(rollbackRejectedReactionInCachedDrops).not.toHaveBeenCalled();
  });

  it("does not treat a throwing onSuccess callback as a request failure", async () => {
    const onSuccess = jest.fn(() => {
      throw new Error("consumer callback failed");
    });
    (commonApi.commonApiPost as jest.Mock).mockResolvedValueOnce({});

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, {
        source: "quick-react",
        onSuccess,
      })
    );

    await act(async () => {
      await result.current.react(":smile:");
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(
      dropReactionMonitoring.recordReactionRequestSucceeded
    ).toHaveBeenCalledTimes(1);
    expect(
      dropReactionMonitoring.recordReactionRequestFailed
    ).not.toHaveBeenCalled();
    expect(
      dropReactionMonitoring.recordReactionRollbackApplied
    ).not.toHaveBeenCalled();
    expect(setToastMock).not.toHaveBeenCalled();
    expect(rollbackMock).not.toHaveBeenCalled();
  });

  it("falls back for unsafe structured quick react failures", async () => {
    (commonApi.commonApiPost as jest.Mock).mockRejectedValueOnce(
      createStructuredReactionError({
        body: "<html><body>Bad Gateway</body></html>",
        message: "<html><body>Bad Gateway</body></html>",
        status: 502,
      })
    );

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    await act(async () => {
      await result.current.react(":smile:");
    });

    expect(setToastMock).toHaveBeenCalledWith({
      message: "Error adding reaction",
      type: "error",
    });
  });

  it("maps unauthorized status when the structured body is empty", async () => {
    (commonApi.commonApiPost as jest.Mock).mockRejectedValueOnce(
      createStructuredReactionError({
        message: "Something went wrong",
        status: 401,
      })
    );

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    await act(async () => {
      await result.current.react(":smile:");
    });

    expect(setToastMock).toHaveBeenCalledWith({
      message: "Unauthorized",
      type: "error",
    });
  });

  it("maps rate-limit status when the structured body is blank", async () => {
    (commonApi.commonApiPost as jest.Mock).mockRejectedValueOnce(
      createStructuredReactionError({
        body: "   ",
        message: "   ",
        status: 429,
      })
    );

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    await act(async () => {
      await result.current.react(":smile:");
    });

    expect(setToastMock).toHaveBeenCalledWith({
      message: "Too Many Requests",
      type: "error",
    });
  });

  it("surfaces the safe status-text message when the structured body is missing", async () => {
    (commonApi.commonApiPost as jest.Mock).mockRejectedValueOnce(
      createStructuredReactionError({
        message: "Service Unavailable",
        status: 503,
      })
    );

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    await act(async () => {
      await result.current.react(":smile:");
    });

    expect(setToastMock).toHaveBeenCalledWith({
      message: "Service Unavailable",
      type: "error",
    });
  });
});
