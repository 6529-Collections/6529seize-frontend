import {
  getWaveChatRepliesSettings,
  getWaveChatRepliesUpdate,
  getWaveChatRepliesValueLabel,
  getWaveReplyEligibility,
} from "@/helpers/waves/wave-chat-replies.helpers";

describe("wave chat replies helpers", () => {
  const replies = {
    open: true,
    collapsed: true,
    authenticated_user_eligible: true,
    authenticated_user_can_delete: false,
  };

  it("reads reply settings and treats a missing config as closed", () => {
    expect(getWaveChatRepliesSettings({ replies })).toEqual({
      open: true,
      collapsed: true,
    });
    expect(getWaveChatRepliesSettings({})).toEqual({
      open: false,
      collapsed: false,
    });
  });

  it("sends reply settings back on a full wave update", () => {
    expect(getWaveChatRepliesUpdate({ replies })).toEqual({
      replies: { open: true, collapsed: true },
    });
  });

  it("omits reply settings the API did not send so they are kept", () => {
    expect(getWaveChatRepliesUpdate({})).toEqual({});
  });

  it("lets open repliers reply even when they cannot chat", () => {
    expect(
      getWaveReplyEligibility({ authenticated_user_eligible: false, replies })
    ).toBe(true);
  });

  it("falls back to chat eligibility without reply settings", () => {
    expect(getWaveReplyEligibility({ authenticated_user_eligible: true })).toBe(
      true
    );
    expect(
      getWaveReplyEligibility({ authenticated_user_eligible: false })
    ).toBe(false);
  });

  it("labels who can reply and where replies show", () => {
    expect(getWaveChatRepliesValueLabel({ open: true, collapsed: true })).toBe(
      "Everyone · Collapsed"
    );
    expect(
      getWaveChatRepliesValueLabel({ open: false, collapsed: false })
    ).toBe("Chat members · Inline");
  });
});
