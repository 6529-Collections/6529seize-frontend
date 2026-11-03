import { registerSourceMessages } from "@/i18n/messageRegistry";
import networkMetricsMessages from "@/i18n/messages/networkMetrics.en-US.json";

/**
 * en-US copy for the network levels, definitions and statistics pages.
 * Import this module from every module that uses these keys in a browser;
 * see `i18n/messages/en-US.complete.ts`.
 */
export const NETWORK_TDH_MESSAGES = registerSourceMessages(
  networkMetricsMessages
);
