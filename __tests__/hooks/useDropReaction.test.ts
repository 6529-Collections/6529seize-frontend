import { useDropReaction } from "@/hooks/drops/useDropReaction";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { useAuth } from "@/components/auth/Auth";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import * as commonApi from "@/services/api/common-api";
import { act, renderHook } from "@testing-library/react";

const setToastMock = jest.fn();
const applyOptimisticDropUpdateMock = jest.fn(() => ({ rollback: jest.fn() }));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
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

jest.mock("@/utils/monitoring/dropReactionMonitoring", () => ({
  beginReactionMutation: jest.fn(() => ({ mutationId: "mutation-1" })),
  deriveReactionAction: jest.fn(() => "add"),
  recordReactionOptimisticApplied: jest.fn(),
  recordReactionRequestFailed: jest.fn(),
  recordReactionRequestSent: jest.fn(),
  recordReactionRequestSucceeded: jest.fn(),
  recordReactionRollbackApplied: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;
const mockUseMyStream = useMyStream as jest.Mock;

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
      new Error("Rate limited")
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
});
