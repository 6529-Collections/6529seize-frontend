import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import styles from "./UserPageStats.module.css";

function getTableColumnLabels(locale: SupportedLocale) {
  return {
    total: t(locale, "user.collected.stats.details.tables.column.total"),
    memes: t(locale, "user.collected.stats.details.tables.column.memes"),
    nextGen: t(locale, "user.collected.stats.details.tables.column.nextGen"),
    gradient: t(locale, "user.collected.stats.details.tables.column.gradient"),
    memeLab: t(locale, "user.collected.stats.details.tables.column.memeLab"),
  };
}

export function UserPageStatsTableHead({
  caption,
  locale = DEFAULT_LOCALE,
}: Readonly<{
  caption?: string;
  locale?: SupportedLocale | undefined;
}> = {}) {
  const labels = getTableColumnLabels(locale);
  const columns = [
    labels.total,
    labels.memes,
    labels.nextGen,
    labels.gradient,
    labels.memeLab,
  ];

  return (
    <>
      {caption ? <caption className="tw-sr-only">{caption}</caption> : null}
      <thead>
        <tr>
          <th aria-hidden="true"></th>
          {columns.map((label) => (
            <th
              key={label}
              scope="col"
              className="text-right !tw-text-[#93939f]"
            >
              {label}
            </th>
          ))}
        </tr>
      </thead>
    </>
  );
}

export function UserPageStatsTableHr(
  props: Readonly<{
    span: number;
  }>
) {
  return (
    <tr aria-hidden="true">
      <td colSpan={props.span} className={styles["collectedAccordionTableHr"]}>
        <hr className="tw-mb-1 tw-mt-1 tw-border-[#93939f]" />
      </td>
    </tr>
  );
}
