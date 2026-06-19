import { useDropLinkPreviewToggleControl } from "@/components/waves/drops/useDropLinkPreviewToggleControl";
import type { useAuth as useAuthHook } from "@/components/auth/Auth";
import type { useMyStreamOptional as useMyStreamOptionalHook } from "@/contexts/wave/MyStreamContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { commonApiPost } from "@/services/api/common-api";
import { act, renderHook } from "@testing-library/react";

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamOptional: jest.fn(),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
}));

const authModule = jest.requireMock("@/components/auth/Auth") as {
  useAuth: typeof useAuthHook;
};
const myStreamModule = jest.requireMock(
  "@/contexts/wave/MyStreamContext"
) as {
  useMyStreamOptional: typeof useMyStreamOptionalHook;
};
const mockedUseAuth = jest.mocked(authModule.useAuth);
const mockedUseMyStreamOptional = jest.mocked(
  myStreamModule.useMyStreamOptional
);
const mockedCommonApiPost = jest.mocked(commonApiPost);

type TestDropDraft = {
  type: DropSize;
  hide_link_preview: boolean;
};

type TestDropUpdate = (draft: TestDropDraft) => TestDropDraft;

function createDrop(hideLinkPreview = false): ApiDrop {
  return {
    id: "drop-1",
    serial_no: 1,
    drop_type: ApiDropType.Chat,
    rank: null,
    wave: {
      id: "wave-1",
      name: "Wave",
      picture: null,
      description_drop_id: "description-drop-1",
      last_drop_time: 0,
      submission_type: null,
      authenticated_user_eligible_to_vote: true,
      authenticated_user_eligible_to_participate: true,
      authenticated_user_eligible_to_chat: true,
      authenticated_user_admin: false,
      visibility_group_id: null,
      participation_group_id: null,
      chat_group_id: null,
      voting_group_id: null,
      admin_group_id: null,
      voting_period_start: null,
      voting_period_end: null,
      voting_credit_type: ApiWaveCreditType.Tdh,
      voting_credit_scope: ApiWaveCreditScope.Wave,
      voting_credit_nfts: null,
      admin_drop_deletion_enabled: false,
      forbid_negative_votes: false,
      pinned: false,
      identity_wave: false,
    },
    author: {
      id: "profile-1",
      handle: "alice",
      pfp: null,
      banner1_color: null,
      banner2_color: null,
      cic: 0,
      rep: 0,
      tdh: 0,
      tdh_rate: 0,
      xtdh: 0,
      xtdh_rate: 0,
      level: 1,
      classification: ApiProfileClassification.Pseudonym,
      sub_classification: null,
      primary_address: "0x0000000000000000000000000000000000000000",
      subscribed_actions: [],
      archived: false,
      active_main_stage_submission_ids: [],
      winner_main_stage_drop_ids: [],
      artist_of_prevote_cards: [],
      profile_wave_id: null,
      is_wave_creator: false,
    },
    created_at: 0,
    updated_at: null,
    title: null,
    parts: [
      {
        part_id: 1,
        content: "https://6529.io",
        media: [],
        attachments: [],
        quoted_drop: null,
      },
    ],
    parts_count: 1,
    referenced_nfts: [],
    mentioned_users: [],
    mentioned_groups: [],
    mentioned_waves: [],
    metadata: [],
    rating: 0,
    realtime_rating: 0,
    rating_prediction: 0,
    top_raters: [],
    raters_count: 0,
    context_profile_context: null,
    subscribed_actions: [],
    is_signed: false,
    reactions: [],
    boosts: 0,
    is_additional_action_promised: false,
    hide_link_preview: hideLinkPreview,
  } satisfies ApiDrop;
}

function setupStream() {
  const updates: TestDropUpdate[] = [];
  const rollback = jest.fn();
  const applyOptimisticDropUpdate = jest.fn(
    ({ update }: { update: TestDropUpdate }) => {
      updates.push(update);
      return { rollback };
    }
  );
  mockedUseMyStreamOptional.mockReturnValue({ applyOptimisticDropUpdate });

  return { applyOptimisticDropUpdate, rollback, updates };
}

function expectToggleControl(
  control: ReturnType<typeof useDropLinkPreviewToggleControl>
): asserts control is NonNullable<
  ReturnType<typeof useDropLinkPreviewToggleControl>
> {
  expect(control).toBeDefined();
}

describe("useDropLinkPreviewToggleControl", () => {
  const setToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      activeProfileProxy: null,
      connectedProfile: { handle: "alice" },
      setToast,
    });
    mockedCommonApiPost.mockResolvedValue({ hide_link_preview: true });
  });

  it("posts desired state and reconciles optimistic state from response", async () => {
    const { updates } = setupStream();
    mockedCommonApiPost.mockResolvedValueOnce({ hide_link_preview: false });
    const { result } = renderHook(() =>
      useDropLinkPreviewToggleControl(createDrop(false))
    );

    expectToggleControl(result.current);
    await act(async () => {
      await result.current.onToggle(true);
    });

    expect(mockedCommonApiPost).toHaveBeenCalledWith({
      endpoint: "drops/drop-1/toggle-hide-link-preview",
      body: { hide_link_preview: true },
    });
    expect(updates).toHaveLength(2);

    const draft = { type: DropSize.FULL, hide_link_preview: false };
    updates[0](draft);
    expect(draft.hide_link_preview).toBe(true);

    draft.hide_link_preview = false;
    updates[1](draft);
    expect(draft.hide_link_preview).toBe(false);
  });

  it("rolls back and shows a toast when the request fails", async () => {
    const { rollback } = setupStream();
    mockedCommonApiPost.mockRejectedValue("Unable to update preview");
    const { result } = renderHook(() =>
      useDropLinkPreviewToggleControl(createDrop(false))
    );

    expectToggleControl(result.current);
    await act(async () => {
      await result.current.onToggle(true);
    });

    expect(rollback).toHaveBeenCalledTimes(1);
    expect(setToast).toHaveBeenCalledWith({
      message: "Unable to update preview",
      type: "error",
    });
  });

  it("clears its cross-instance lock when the owner unmounts", async () => {
    setupStream();
    let resolveFirstRequest: (drop: {
      hide_link_preview: boolean;
    }) => void = () => {};
    mockedCommonApiPost
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirstRequest = resolve;
          })
      )
      .mockResolvedValueOnce({ hide_link_preview: true });

    const first = renderHook(() =>
      useDropLinkPreviewToggleControl(createDrop(false))
    );

    expectToggleControl(first.result.current);
    act(() => {
      void first.result.current.onToggle(true);
    });

    const second = renderHook(() =>
      useDropLinkPreviewToggleControl(createDrop(false))
    );

    expectToggleControl(second.result.current);
    act(() => {
      void second.result.current.onToggle(true);
    });

    expect(mockedCommonApiPost).toHaveBeenCalledTimes(1);

    first.unmount();

    expectToggleControl(second.result.current);
    await act(async () => {
      await second.result.current.onToggle(true);
    });

    expect(mockedCommonApiPost).toHaveBeenCalledTimes(2);

    await act(async () => {
      resolveFirstRequest({ hide_link_preview: true });
    });
  });
});
