import { registerSourceMessages } from "@/i18n/messageRegistry";
import desktopDownloadMessages from "@/i18n/messages/desktopDownload.en-US.json";

/**
 * en-US copy for the 6529 Desktop pages under `/desktop`: the menu, the
 * test-release notice, the download page and its file table, the guide,
 * the known issues and the release history. Import this module from every
 * module that uses these keys in a browser; see
 * `i18n/messages/en-US.complete.ts`.
 */
export const DESKTOP_DOWNLOAD_MESSAGES = registerSourceMessages(
  desktopDownloadMessages
);
