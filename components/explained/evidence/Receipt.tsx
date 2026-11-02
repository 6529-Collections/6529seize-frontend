import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { kt, type KitKey } from "../i18n";

/**
 * A day's receipt (EXPLAINED.md §4.2, §6.4): a slip with a torn edge, rows
 * in a fixed order (TDH-DESIGN.md §4.5): result, snapshot, verdict, total,
 * differences, history, rule version (as the file reports it, with its
 * drift note), rule ID, registry, roots, input, records, then this file and
 * its hash computed in the browser.
 */
const RECEIPT_ORDER = [
  "result",
  "snapshot",
  "verdict",
  "total",
  "differences",
  "history",
  "ruleVersion",
  "ruleId",
  "registry",
  "cycleRoot",
  "walletRoot",
  "historyRoot",
  "input",
  "records",
  "file",
] as const;

export type ReceiptRowId = (typeof RECEIPT_ORDER)[number];

const LABEL: Record<ReceiptRowId, KitKey> = {
  result: "explained.kit.receipt.result",
  snapshot: "explained.kit.receipt.snapshot",
  verdict: "explained.kit.receipt.verdict",
  total: "explained.kit.receipt.total",
  differences: "explained.kit.receipt.differences",
  history: "explained.kit.receipt.history",
  ruleVersion: "explained.kit.receipt.ruleVersion",
  ruleId: "explained.kit.receipt.ruleId",
  registry: "explained.kit.receipt.registry",
  cycleRoot: "explained.kit.receipt.cycleRoot",
  walletRoot: "explained.kit.receipt.walletRoot",
  historyRoot: "explained.kit.receipt.historyRoot",
  input: "explained.kit.receipt.input",
  records: "explained.kit.receipt.records",
  file: "explained.kit.receipt.file",
};

export interface ReceiptRowData {
  readonly id: ReceiptRowId;
  readonly value: ReactNode;
  /** The row's note under it: a drift note, what the root is for. */
  readonly note?: ReactNode;
}

export function ReceiptRow({
  row,
  locale,
}: {
  readonly row: ReceiptRowData;
  readonly locale: SupportedLocale;
}) {
  return (
    <div
      className="tw-grid tw-grid-cols-1 tw-gap-0.5 tw-border-0 tw-border-b tw-border-dashed tw-border-iron-800 tw-py-[9px] tw-text-[15px] tw-leading-6 last:tw-border-b-0 md:tw-grid-cols-[190px_minmax(0,1fr)] md:tw-gap-x-[18px]"
      data-receipt-row={row.id}
    >
      <span className="tw-text-iron-400">{kt(locale, LABEL[row.id])}</span>
      <span className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-2.5 tw-font-medium tw-text-iron-50">
        {row.value}
      </span>
      {row.note !== undefined && (
        <div className="md:tw-col-start-2">{row.note}</div>
      )}
    </div>
  );
}

/**
 * A receipt row's note: one quiet line under the value, in the row's own
 * rhythm, never a box or a status colour.
 */
export function ReceiptNote({ children }: { readonly children: ReactNode }) {
  return (
    <div className="tw-max-w-[560px] tw-text-sm tw-leading-[21px] tw-text-iron-400">
      {children}
    </div>
  );
}

export default function Receipt({
  rows,
  cycle,
  locale,
}: {
  readonly rows: readonly ReceiptRowData[];
  /** The cycle, printed, for the receipt's accessible name. */
  readonly cycle: string;
  readonly locale: SupportedLocale;
}) {
  const ordered = [...rows].sort(
    (a, b) => RECEIPT_ORDER.indexOf(a.id) - RECEIPT_ORDER.indexOf(b.id)
  );
  const outOfOrder = rows.some((row, index) => row.id !== ordered[index]?.id);
  if (outOfOrder) {
    throw new Error(
      `A receipt's rows go in a fixed order: ${RECEIPT_ORDER.join(", ")}.`
    );
  }
  return (
    <div className="tw-relative tw-pb-2.5" data-receipt="">
      <section
        className="tw-rounded-t-xl tw-border tw-border-b-0 tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-4 tw-pb-[26px] tw-pt-[18px] md:tw-px-[26px] md:tw-pb-8 md:tw-pt-6"
        aria-label={kt(locale, "explained.kit.receipt.label", { cycle })}
      >
        {ordered.map((row) => (
          <ReceiptRow key={row.id} row={row} locale={locale} />
        ))}
      </section>
      <span
        className="tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-2.5 tw-bg-[linear-gradient(-45deg,transparent_6px,#131316_6px),linear-gradient(45deg,transparent_6px,#131316_6px)] tw-bg-[length:12px_10px] tw-bg-repeat-x"
        aria-hidden="true"
      />
    </div>
  );
}
