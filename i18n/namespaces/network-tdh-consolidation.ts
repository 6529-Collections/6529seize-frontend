import { registerSourceMessages } from "@/i18n/messageRegistry";
import networkTdhConsolidationMessages from "@/i18n/messages/networkTdhConsolidation.en-US.json";

/**
 * en-US copy for the TDH consolidation guide, its order simulator and the
 * delegation tap guide. Import this module from every module that uses these
 * keys in a browser; see `i18n/messages/en-US.complete.ts`.
 */
export const NETWORK_TDH_CONSOLIDATION_MESSAGES = registerSourceMessages(
  networkTdhConsolidationMessages
);
