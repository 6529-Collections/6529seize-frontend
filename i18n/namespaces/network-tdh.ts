import { registerSourceMessages } from "@/i18n/messageRegistry";
import networkMetricsMessages from "@/i18n/messages/networkMetrics.en-US.json";
import networkTdhExampleMessages from "@/i18n/messages/networkTdhExample.en-US.json";
import networkTdhExplainerMessages from "@/i18n/messages/networkTdhExplainer.en-US.json";
import networkTdhMessages from "@/i18n/messages/networkTdh.en-US.json";
import networkTdhProfileMessages from "@/i18n/messages/networkTdhProfile.en-US.json";
import networkTdhRulesMessages from "@/i18n/messages/networkTdhRules.en-US.json";

/**
 * en-US copy for the network TDH, levels, definitions and statistics pages.
 * Import this module from every module that uses these keys in a browser;
 * see `i18n/messages/en-US.complete.ts`.
 */
export const NETWORK_TDH_MESSAGES = registerSourceMessages({
  ...networkMetricsMessages,
  ...networkTdhMessages,
  ...networkTdhExplainerMessages,
  ...networkTdhExampleMessages,
  ...networkTdhProfileMessages,
  ...networkTdhRulesMessages,
});
