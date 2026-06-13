import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import styles from "./UserPageStats.module.scss";

function getTableColumnLabels() {
  return {
    total: t(
      DEFAULT_LOCALE,
      "user.collected.stats.details.tables.column.total"
    ),
    memes: t(
      DEFAULT_LOCALE,
      "user.collected.stats.details.tables.column.memes"
    ),
    nextGen: t(
      DEFAULT_LOCALE,
      "user.collected.stats.details.tables.column.nextGen"
    ),
    gradient: t(
      DEFAULT_LOCALE,
      "user.collected.stats.details.tables.column.gradient"
    ),
    memeLab: t(
      DEFAULT_LOCALE,
      "user.collected.stats.details.tables.column.memeLab"
    ),
  };
}

export function UserPageStatsTableHead({
  caption,
}: Readonly<{
  caption?: string;
}> = {}) {
  const labels = getTableColumnLabels();

  return (
    <>
      {caption ? <caption className="tw-sr-only">{caption}</caption> : null}
      <thead>
        <tr>
          <th aria-hidden="true"></th>
          <th scope="col" className="text-right !tw-text-[#93939f]">
            {labels.total}
          </th>
          <th scope="col" className="text-right !tw-text-[#93939f]">
            {labels.memes}
          </th>
          <th scope="col" className="text-right !tw-text-[#93939f]">
            {labels.nextGen}
          </th>
          <th scope="col" className="text-right !tw-text-[#93939f]">
            {labels.gradient}
          </th>
          <th scope="col" className="text-right !tw-text-[#93939f]">
            {labels.memeLab}
          </th>
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
        <hr className="mb-1 mt-1 tw-border-[#93939f]" />
      </td>
    </tr>
  );
}
