import type { ApiCreateNewWaveChatRepliesConfig } from "@/generated/models/ApiCreateNewWaveChatRepliesConfig";
import type { ApiWaveChatConfig } from "@/generated/models/ApiWaveChatConfig";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";

export interface WaveChatRepliesSettings {
  /** Everyone who can view the wave may reply, not only chat members. */
  readonly open: boolean;
  /** Replies stay out of the main stream and open under each drop. */
  readonly collapsed: boolean;
}

export const getWaveChatRepliesSettings = (
  chat: Pick<ApiWaveChatConfig, "replies">
): WaveChatRepliesSettings => ({
  open: chat.replies?.open === true,
  collapsed: chat.replies?.collapsed === true,
});

/**
 * Keeps reply settings when a full wave update is sent. Older API responses
 * have no reply settings; omitting them tells the API to keep what it has.
 */
export const getWaveChatRepliesUpdate = (
  chat: Pick<ApiWaveChatConfig, "replies">
): { replies?: ApiCreateNewWaveChatRepliesConfig } =>
  chat.replies
    ? {
        replies: {
          open: chat.replies.open,
          collapsed: chat.replies.collapsed,
        },
      }
    : {};

/** Older API responses have no reply settings; replies then follow chat. */
export const getWaveReplyEligibility = (
  chat: Pick<ApiWaveChatConfig, "authenticated_user_eligible" | "replies">
): boolean =>
  chat.replies?.authenticated_user_eligible ?? chat.authenticated_user_eligible;

export const getWaveChatRepliesValueLabel = (
  settings: WaveChatRepliesSettings
): string =>
  waveRightPanelText(
    "waves.sidebar.rightPanel.configuration.chat.replies.value",
    {
      audience: waveRightPanelText(
        settings.open
          ? "waves.sidebar.rightPanel.configuration.chat.replies.audience.everyone"
          : "waves.sidebar.rightPanel.configuration.chat.replies.audience.chatMembers"
      ),
      layout: waveRightPanelText(
        settings.collapsed
          ? "waves.sidebar.rightPanel.configuration.chat.replies.layout.collapsed"
          : "waves.sidebar.rightPanel.configuration.chat.replies.layout.inline"
      ),
    }
  );
