import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export const formatGroupMembersCount = ({
  count,
  locale,
}: {
  readonly count: number;
  readonly locale: SupportedLocale;
}): string =>
  t(
    locale,
    `waves.create.groups.members.currentCount.${new Intl.PluralRules(locale).select(count) === "one" ? "one" : "other"}`,
    { count: formatInteger(locale, count) }
  );
