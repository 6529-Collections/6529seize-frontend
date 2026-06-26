export const HELP_BOT_CREDIT_REP_CATEGORY = "Help6529 Credits";

export const isHelpBotCreditRepCategory = (
  category: string | null | undefined
): boolean =>
  category?.trim().toLowerCase() ===
  HELP_BOT_CREDIT_REP_CATEGORY.toLowerCase();
