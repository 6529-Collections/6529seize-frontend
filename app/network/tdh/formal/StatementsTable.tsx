"use client";

import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { Fragment, useId, useState } from "react";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import TdhStatusPill from "../shared/TdhStatusPill";
import {
  TDH_CHIP_BUTTON,
  TDH_CHIP_OFF,
  TDH_CHIP_ON,
  TDH_FOCUS_RING,
  TDH_TABLE,
  TDH_TD,
  TDH_TD_STACK_MD,
  TDH_TH,
} from "../shared/tdhStyles";
import type { StatementRow, StatementStatus } from "./statements";

type Filter = StatementStatus | "all";

/** Statements of the Lean model with their status; rows expand to the Lean text. */
export default function StatementsTable({
  locale,
  rows,
}: {
  readonly locale: SupportedLocale;
  readonly rows: readonly StatementRow[];
}) {
  const baseId = useId();
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(null);
  const statuses = [...new Set(rows.map((row) => row.status))];
  const filters: readonly Filter[] =
    statuses.length > 1 ? ["all", ...statuses] : [];
  const shown = rows.filter((row) => filter === "all" || row.status === filter);

  return (
    <div>
      {filters.length > 0 && (
        <div
          role="group"
          aria-label={t(locale, "network.tdh.formal.statements.filterLabel")}
          className="tw-mb-3 tw-flex tw-flex-wrap tw-gap-2"
        >
          {filters.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={filter === option}
              onClick={() => setFilter(option)}
              className={`${TDH_CHIP_BUTTON} ${filter === option ? TDH_CHIP_ON : TDH_CHIP_OFF}`}
            >
              {option === "all"
                ? t(locale, "network.tdh.formal.statements.filterAll")
                : t(locale, `network.tdh.shared.pill.${option}`)}
            </button>
          ))}
        </div>
      )}
      <div className="tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07]">
        <table className={`${TDH_TABLE} tw-block md:tw-table`}>
          <caption className="tw-sr-only">
            {t(locale, "network.tdh.formal.statements.caption", {
              shown: formatInteger(locale, shown.length),
              total: formatInteger(locale, rows.length),
            })}
          </caption>
          <thead className="tw-hidden md:tw-table-header-group">
            <tr>
              <th scope="col" className={TDH_TH}>
                {t(locale, "network.tdh.formal.statements.statement")}
              </th>
              <th scope="col" className={TDH_TH}>
                {t(locale, "network.tdh.formal.statements.plain")}
              </th>
              <th scope="col" className={TDH_TH}>
                {t(locale, "network.tdh.formal.statements.rule")}
              </th>
              <th scope="col" className={TDH_TH}>
                {t(locale, "network.tdh.formal.statements.status")}
              </th>
            </tr>
          </thead>
          <tbody className="tw-block md:tw-table-row-group">
            {shown.map((row) => {
              const isOpen = open === row.id;
              const detailsId = `${baseId}-${row.id}`;
              return (
                <Fragment key={row.id}>
                  <tr className="tw-grid tw-gap-1 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-p-4 first:tw-border-t-0 md:tw-table-row md:tw-p-0">
                    <th
                      scope="row"
                      className={`${TDH_TD_STACK_MD} tw-font-medium`}
                    >
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={detailsId}
                        onClick={() => setOpen(isOpen ? null : row.id)}
                        aria-label={t(
                          locale,
                          "network.tdh.formal.statements.showLean",
                          { title: row.title }
                        )}
                        className={`-tw-ml-2 tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-2 tw-text-left tw-text-sm tw-font-medium tw-text-iron-50 hover:tw-bg-iron-800 ${TDH_FOCUS_RING}`}
                      >
                        <ChevronRightIcon
                          aria-hidden="true"
                          className={`tw-size-4 tw-shrink-0 tw-text-iron-400 tw-transition-transform motion-reduce:tw-transition-none ${isOpen ? "tw-rotate-90" : ""}`}
                        />
                        {row.title}
                      </button>
                    </th>
                    <td className={`${TDH_TD_STACK_MD} tw-text-iron-300`}>
                      {row.plain}
                    </td>
                    <td
                      className={`${TDH_TD} tw-whitespace-nowrap tw-border-0 tw-p-0 tw-font-mono tw-text-xs tw-text-iron-400`}
                    >
                      {row.p26}
                    </td>
                    <td className={`${TDH_TD_STACK_MD}`}>
                      <TdhStatusPill
                        pill={row.status}
                        locale={locale}
                        size="sm"
                      />
                    </td>
                  </tr>
                  <tr
                    id={detailsId}
                    hidden={!isOpen}
                    className={
                      isOpen ? "tw-block md:tw-table-row" : "tw-hidden"
                    }
                  >
                    <td
                      colSpan={4}
                      className="tw-block tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.06] tw-bg-iron-950/60 tw-px-4 tw-py-3 md:tw-table-cell"
                    >
                      <p className="tw-m-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-500">
                        {t(locale, "network.tdh.formal.statements.lean")}
                      </p>
                      {row.lean ? (
                        <pre
                          tabIndex={0}
                          role="region"
                          aria-label={t(
                            locale,
                            "network.tdh.formal.statements.lean"
                          )}
                          className="tw-m-0 tw-mt-2 tw-overflow-x-auto tw-whitespace-pre tw-font-mono tw-text-xs tw-leading-5 tw-text-iron-100"
                        >
                          <code className="tw-text-iron-100">{row.lean}</code>
                        </pre>
                      ) : (
                        <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-300">
                          {t(
                            locale,
                            "network.tdh.formal.statements.leanPending"
                          )}
                        </p>
                      )}
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
