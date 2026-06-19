import { EN_GB_NEW_VERSION_TOAST_MESSAGES } from "@/i18n/messages/new-version-toast";
import type { MessageKey } from "@/i18n/messages/en-US";

export const EN_GB_MESSAGES = {
  "media.video.captions": "Captions",
  "media.video.download": "Download media",
  "media.video.downloading": "Downloading media",
  "media.video.exitFullscreen": "Exit full screen",
  "media.video.fullscreen": "Full screen",
  "media.video.mute": "Mute video",
  "media.video.pause": "Pause video",
  "media.video.play": "Play video",
  "media.video.player": "Video player",
  "media.video.playPreview": "Play video preview",
  "media.video.seek": "Seek video",
  "media.video.unmute": "Unmute video",
  "media.video.unsupported": "Your browser does not support the video tag.",
  "profileCms.interactive.fullscreen": "Full screen",
  "profileCms.interactive.exitFullscreen": "Exit full screen",
  "drop.media.processing": "Processing image",
  "drop.media.unavailable": "Image unavailable",
  "drop.media.processingFailed": "Image processing failed.",
  "drop.media.processingTimedOut": "Image processing timed out.",
  ...EN_GB_NEW_VERSION_TOAST_MESSAGES,
  "theMemes.documentTitle": "The Memes | Collections",
  "theMemes.description.collections": "Collections",
} satisfies Partial<Record<MessageKey, string>>;
