import { registerSourceMessages } from "@/i18n/messageRegistry";
import aiDownloadMessages from "@/i18n/messages/aiDownload.en-US.json";

/**
 * en-US copy for the 6529 AI pages under `/ai`: the menu, the notice that
 * the release is untested, the download page and its file table. Import
 * this module from every module that uses these keys in a browser; see
 * `i18n/messages/en-US.complete.ts`.
 */
export const AI_DOWNLOAD_MESSAGES = registerSourceMessages(aiDownloadMessages);
