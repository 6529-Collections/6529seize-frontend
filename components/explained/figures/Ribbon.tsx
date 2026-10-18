import type { ReactNode } from "react";

/**
 * The ribbon (EXPLAINED.md §4.4): when? One tile per result in a row, then
 * the open day, days to come and a date that is only "about". A list, so a
 * screen reader hears each tile with its date (§11). Ten across on a
 * desktop, four on a phone; tiles marked phone-hidden drop out there.
 */
export interface RibbonItem {
  readonly key: string;
  readonly node: ReactNode;
  readonly hideOnPhone?: boolean;
}

export default function Ribbon({
  items,
  label,
  columns = 10,
}: {
  readonly items: readonly RibbonItem[];
  readonly label: string;
  /** Tiles across on a desktop. */
  readonly columns?: number;
}) {
  return (
    <ol
      className="tw-m-0 tw-grid tw-list-none tw-grid-cols-4 tw-gap-1.5 tw-p-0 md:tw-gap-2 md:[grid-template-columns:repeat(var(--ex-ribbon),minmax(0,1fr))]"
      style={{ ["--ex-ribbon" as string]: String(columns) }}
      aria-label={label}
      data-fig="ribbon"
    >
      {items.map((item) => (
        <li
          key={item.key}
          className={item.hideOnPhone ? "max-md:tw-hidden" : ""}
        >
          {item.node}
        </li>
      ))}
    </ol>
  );
}
