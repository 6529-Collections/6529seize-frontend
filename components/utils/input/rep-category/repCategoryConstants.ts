const HELP_BOT_CREDIT_REP_CATEGORY = "Help6529 Credits";

export const HELP_BOT_CREDIT_REP_CATEGORY_ERROR =
  "Help6529 Credits is managed by help6529.";

export const isHelpBotCreditRepCategory = (
  category: string | null | undefined
): boolean =>
  category?.trim().toLowerCase() ===
  HELP_BOT_CREDIT_REP_CATEGORY.toLowerCase();
