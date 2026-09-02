import { getOptimisticDrop } from "@/components/waves/utils/getOptimisticDrop";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiWave } from "@/generated/models/ApiWave";

jest.mock("@/helpers/waves/drop.helpers", () => ({
  ...jest.requireActual("@/helpers/waves/drop.helpers"),
  getOptimisticDropId: jest.fn(() => "temp-drop-1"),
}));

describe("getOptimisticDrop", () => {
  it("marks a locally authored optimistic drop as visible", () => {
    const request = {
      parts: [{ content: "gm", media: [] }],
      referenced_nfts: [],
      mentioned_users: [],
      mentioned_waves: [],
      mentioned_groups: [],
      metadata: [],
    } as unknown as ApiCreateDropRequest;
    const connectedProfile = {
      id: "profile-1",
      handle: "alice",
      banner1: null,
      banner2: null,
    } as ApiIdentity;
    const wave = {
      id: "wave-1",
      name: "Wave",
      pinned: false,
      picture: null,
      description_drop: { id: "description-drop" },
      last_drop_time: 0,
      participation: {
        authenticated_user_eligible: true,
        submission_strategy: null,
      },
      voting: {
        authenticated_user_eligible: true,
        credit_type: "TDH",
        credit_scope: "WAVE",
        period: null,
        forbid_negative_votes: false,
        credit_nfts: null,
      },
      chat: {
        authenticated_user_eligible: true,
        links_disabled: false,
      },
      identity_wave: false,
      author: { handle: "alice" },
    } as unknown as ApiWave;

    const result = getOptimisticDrop(
      request,
      connectedProfile,
      wave,
      null,
      ApiDropType.Chat
    );

    expect(result).toEqual(
      expect.objectContaining({
        id: "temp-drop-1",
        moderation: {
          status: ApiDropModerationStatus.Visible,
          can_view: true,
        },
        viewer_context: {
          author_blocked: false,
          drop_hidden: false,
        },
      })
    );
  });
});
