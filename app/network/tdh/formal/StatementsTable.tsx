"use client";

import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { Fragment, useId, useState, type ReactNode } from "react";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import TdhStatusPill from "../shared/TdhStatusPill";
import {
  TDH_CHIP_BUTTON,
  TDH_CHIP_OFF,
  TDH_CHIP_ON,
  TDH_FOCUS_RING,
  TDH_TABLE,
  TDH_TD_STACK_MD,
  TDH_TH,
} from "../shared/tdhStyles";
import type { LeanStatement, StatementStatus } from "./leanResults";

type Filter = StatementStatus | "all";

const ORDER: readonly StatementStatus[] = [
  "proved",
  "byDefinition",
  "checkedBuild",
  "shownFalse",
];

/**
 * The model's statements with their status. A row opens to its scope, the
 * theorem names and the Lean statement; `extra` adds content to a row, such
 * as the counterexample table of the first netting rule.
 */
export default function StatementsTable({
  locale,
  rows,
  caption,
  extra = {},
}: {
  readonly locale: SupportedLocale;
  readonly rows: readonly LeanStatement[];
  readonly caption: string;
  readonly extra?: Readonly<Record<string, ReactNode>>;
}) {
  const baseId = useId();
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(null);
  const present = ORDER.filter((status) =>
    rows.some((row) => row.status === status)
  );
  const filters: readonly Filter[] =
    present.length > 1 ? ["all", ...present] : [];
  const shown = rows.filter((row) => filter === "all" || row.status === filter);
  const text = (row: LeanStatement, part: "title" | "plain" | "scope") =>
    t(locale, `network.tdh.formal.st.${row.id}.${part}` as MessageKey);

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
              className={`${TDH_CHIP_BUTTON} tw-shrink-0 ${filter === option ? TDH_CHIP_ON : TDH_CHIP_OFF}`}
            >
              {option === "all"
                ? t(locale, "network.tdh.formal.statements.filterAll")
                : t(locale, `network.tdh.shared.pill.${option}`)}
              <span className="tw-rounded-full tw-bg-iron-800 tw-px-1.5 tw-text-xs tw-tabular-nums tw-text-iron-300">
                {formatInteger(
                  locale,
                  option === "all"
                    ? rows.length
                    : rows.filter((row) => row.status === option).length
                )}
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07]">
        <table
          className={`${TDH_TABLE} tw-block md:tw-table md:tw-table-fixed`}
        >
          <caption className="tw-sr-only">
            {t(locale, "network.tdh.formal.statements.caption", {
              shown: formatInteger(locale, shown.length),
              total: formatInteger(locale, rows.length),
            })}
            {` ${caption}`}
          </caption>
          <thead className="tw-hidden md:tw-table-header-group">
            <tr>
              <th scope="col" className={`${TDH_TH} tw-w-[28%]`}>
                {t(locale, "network.tdh.formal.statements.statement")}
              </th>
              <th scope="col" className={TDH_TH}>
                {t(locale, "network.tdh.formal.statements.plain")}
              </th>
              <th scope="col" className={`${TDH_TH} tw-w-[10rem]`}>
                {t(locale, "network.tdh.formal.statements.status")}
              </th>
            </tr>
          </thead>
          <tbody className="tw-block md:tw-table-row-group">
            {shown.map((row) => {
              const isOpen = open === row.id;
              const detailsId = `${baseId}-${row.id}`;
              const title = text(row, "title");
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
                          { title }
                        )}
                        className={`-tw-ml-2 tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-2 tw-text-left tw-text-sm tw-font-medium tw-text-iron-50 hover:tw-bg-iron-800 ${TDH_FOCUS_RING}`}
                      >
                        <ChevronRightIcon
                          aria-hidden="true"
                          className={`tw-size-4 tw-shrink-0 tw-text-iron-400 tw-transition-transform motion-reduce:tw-transition-none ${isOpen ? "tw-rotate-90" : ""}`}
                        />
                        {title}
                      </button>
                      <span className="tw-block tw-pl-6 tw-font-mono tw-text-[11px] tw-font-normal tw-text-iron-400">
                        {row.refs.join(" · ")}
                      </span>
                    </th>
                    <td className={`${TDH_TD_STACK_MD} tw-text-iron-300`}>
                      {text(row, "plain")}
                    </td>
                    <td className={`${TDH_TD_STACK_MD} tw-pt-1 md:tw-pt-3`}>
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
                      colSpan={3}
                      className="tw-block tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.06] tw-bg-iron-950/60 tw-px-4 tw-py-4 md:tw-table-cell"
                    >
                      <div className="tw-space-y-3">
                        <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
                          <span className="tw-font-medium tw-text-iron-100">
                            {t(locale, "network.tdh.formal.statements.scope")}:
                          </span>{" "}
                          {text(row, "scope")}
                        </p>
                        {extra[row.id]}
                        {row.names.length > 0 && (
                          <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
                            {t(locale, "network.tdh.formal.statements.names", {
                              names: row.names.join(", "),
                            })}
                            {" · "}
                            {t(locale, "network.tdh.formal.statements.where", {
                              file: row.file,
                            })}
                          </p>
                        )}
                        {row.lean && (
                          <pre
                            tabIndex={0}
                            role="region"
                            aria-label={`${t(locale, "network.tdh.formal.statements.lean")}: ${title}`}
                            className={`tw-m-0 tw-overflow-x-auto tw-whitespace-pre tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950 tw-p-3 tw-font-mono tw-text-xs tw-leading-5 tw-text-iron-100 ${TDH_FOCUS_RING}`}
                          >
                            <code className="tw-font-mono tw-text-iron-100">
                              {row.lean}
                            </code>
                          </pre>
                        )}
                      </div>
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
