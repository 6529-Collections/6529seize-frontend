import Link from "next/link";
import { kt } from "@/components/explained/i18n";
import { Icon } from "@/components/explained/marks/glyphs";
import type { PageIndexRow } from "@/components/explained/shell/PageIndex";
import { EX_FOCUS } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";

/**
 * The chapter's pages in two columns on a desktop (a page-local layout of
 * the kit's PageIndex, listed for promotion): the spine 1 to 4 with a line
 * each on the left, the shelf S1 to S5, titles only, on the right; one list
 * in reading order (the grid's dense flow lifts the shelf beside the
 * spine), one column on a phone. Same marks as PageIndex: spine
 * numbers in blue, shelf numbers grey.
 */
function Row({ row }: { readonly row: PageIndexRow }) {
  return (
    <li
      className={`tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 ${row.shelf ? "lg:tw-col-start-2" : "lg:tw-col-start-1"}`}
    >
      <Link
        href={row.href ?? "/network/tdh"}
        className={`tw-grid tw-grid-cols-[40px_minmax(0,1fr)_24px] tw-items-baseline tw-gap-x-3 tw-gap-y-1 tw-py-4 tw-no-underline hover:tw-bg-white/[0.015] md:tw-grid-cols-[56px_minmax(0,1fr)_30px] md:tw-gap-x-5 ${EX_FOCUS}`}
      >
        <span
          className={`tw-text-[15px] tw-font-semibold ${row.shelf ? "tw-text-iron-400" : "tw-text-primary-300"}`}
        >
          {row.no}
        </span>
        <span
          className={`tw-font-semibold tw-text-iron-50 ${row.shelf ? "tw-text-lg tw-leading-6" : "tw-text-[21px] tw-leading-7"}`}
        >
          {row.title}
        </span>
        <span className="tw-justify-self-end tw-text-iron-400">
          <Icon kind="arrow" />
        </span>
        {row.desc !== undefined && (
          <span className="tw-col-start-2 tw-text-base tw-leading-6 tw-text-iron-400">
            {row.desc}
          </span>
        )}
      </Link>
    </li>
  );
}

export default function ChapterPages({
  rows,
  locale,
}: {
  readonly rows: readonly PageIndexRow[];
  readonly locale: SupportedLocale;
}) {
  // Reading order: the spine, then the shelf; on a desktop each fills its own column.
  const spine = rows.filter((row) => !row.shelf);
  const shelf = rows.filter((row) => row.shelf);
  return (
    <ol
      aria-label={kt(locale, "explained.kit.index.label")}
      className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-border-0 tw-border-t tw-border-solid tw-border-iron-700 tw-p-0 lg:tw-grid-flow-row-dense lg:tw-grid-cols-2 lg:tw-gap-x-12"
    >
      {[...spine, ...shelf].map((row) => (
        <Row key={row.href} row={row} />
      ))}
    </ol>
  );
}
