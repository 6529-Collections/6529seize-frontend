import type { SupportedLocale } from "@/i18n/locales";
import { CARD, type TierId } from "./_lib/card";
import { hw, hwRich } from "./_lib/copy";
import { MACHINES, SPEC_ROWS } from "./_lib/data";
import { Hw, nb, sourceTitle } from "./_lib/facts";
import { Disclosure, FactTable, READ } from "./parts";

/**
 * The three home tiers in full: on a wide screen one table, Good's column
 * marked as the card marks it, and a Good cell that repeats Acceptable's
 * says so; on a phone one block per tier, Good open, every cell in full.
 * Then the systems every tier runs, and the machines that fit with their
 * store prices behind a disclosure, grouped by tier.
 */
const TIERS: readonly TierId[] = ["acceptable", "good", "great"];

function SpecTable({ locale }: { readonly locale: SupportedLocale }) {
  const th =
    "tw-border-0 tw-border-b tw-border-solid tw-border-iron-700 tw-px-4 tw-py-3 tw-text-left tw-align-bottom";
  const goodHead = "tw-bg-primary-400/[0.06] tw-rounded-t-xl";
  const goodCell = "tw-bg-primary-400/[0.06] tw-text-iron-50";
  return (
    <table
      className="tw-hidden tw-w-full tw-table-fixed tw-border-collapse tw-text-[15px] tw-leading-6 before:tw-content-none after:tw-content-none lg:tw-table lg:tw-text-base lg:tw-leading-[26px] [&_:is(thead,tbody,tr)]:before:tw-content-none [&_:is(thead,tbody,tr)]:after:tw-content-none"
      aria-label={hw(locale, "spec.caption")}
    >
      <colgroup>
        <col className="tw-w-[16%]" />
        <col className="tw-w-[28%]" />
        <col className="tw-w-[28%]" />
        <col className="tw-w-[28%]" />
      </colgroup>
      <thead>
        <tr>
          <th
            scope="col"
            className={`${th} tw-pl-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.1em] tw-text-iron-400`}
          >
            {hw(locale, "spec.col")}
          </th>
          {TIERS.map((tier) => (
            <th
              key={tier}
              scope="col"
              className={`${th} ${tier === "good" ? goodHead : ""}`}
            >
              <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
                <span className="tw-text-lg tw-font-semibold tw-text-iron-50">
                  {CARD.tiers[tier].name}
                </span>
                {tier === "good" && (
                  <span className="tw-rounded-full tw-bg-primary-500 tw-px-2 tw-py-0.5 tw-text-[12px] tw-font-bold tw-uppercase tw-tracking-[0.1em] tw-text-white">
                    {CARD.recommended}
                  </span>
                )}
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {SPEC_ROWS.map((row) => (
          <tr
            key={row.id}
            data-fact={`hw.spec.${row.id}`}
            title={sourceTitle(row.source, locale)}
          >
            <th
              scope="row"
              className="tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-3.5 tw-pr-4 tw-text-left tw-align-top tw-text-sm tw-font-semibold tw-text-iron-400"
            >
              {hw(locale, `spec.row.${row.id}`)}
            </th>
            {TIERS.map((tier) => {
              const same = tier === "good" && row.good === row.acceptable;
              return (
                <td
                  key={tier}
                  className={`tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-px-4 tw-py-3.5 tw-align-top ${tier === "good" ? goodCell : "tw-text-iron-300"}`}
                >
                  {same ? (
                    <span className="tw-text-iron-400">
                      {hw(locale, "spec.same")}
                    </span>
                  ) : (
                    nb(row[tier])
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TierBlocks({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-3 lg:tw-hidden">
      {TIERS.map((tier) => (
        <Disclosure
          key={tier}
          open={tier === "good"}
          summary={
            <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
              {hw(locale, "spec.phone", { tier: CARD.tiers[tier].name })}
              {tier === "good" && (
                <span className="tw-rounded-full tw-bg-primary-500 tw-px-2 tw-py-0.5 tw-text-[12px] tw-font-bold tw-uppercase tw-tracking-[0.1em] tw-text-white">
                  {CARD.recommended}
                </span>
              )}
            </span>
          }
        >
          <dl className="tw-m-0">
            {SPEC_ROWS.map((row) => (
              <div
                key={row.id}
                className="tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-2.5 last:tw-border-b-0"
                data-fact={`hw.spec.${row.id}`}
                title={sourceTitle(row.source, locale)}
              >
                <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-leading-5 tw-tracking-[0.1em] tw-text-iron-400">
                  {hw(locale, `spec.row.${row.id}`)}
                </dt>
                <dd className="tw-m-0 tw-mt-0.5 tw-text-[15px] tw-leading-6 tw-text-iron-50">
                  {nb(row[tier])}
                </dd>
              </div>
            ))}
          </dl>
        </Disclosure>
      ))}
    </div>
  );
}

function Machines({ locale }: { readonly locale: SupportedLocale }) {
  const tierName = (tier: (typeof MACHINES)[number]["tier"]) =>
    tier === "all" ? hw(locale, "machines.any") : CARD.tiers[tier].name;
  return (
    <Disclosure
      id="machines"
      summary={hwRich(locale, "machines.summary", {
        date: <Hw id="read.day" locale={locale} />,
      })}
    >
      <FactTable
        locale={locale}
        caption={hw(locale, "machines.caption")}
        plainHead
        columns={[
          {
            key: "machine",
            label: hw(locale, "machines.col.machine"),
            width: "tw-w-[52%]",
          },
          {
            key: "price",
            label: hw(locale, "machines.col.price"),
            numeric: true,
            width: "tw-w-[16%]",
          },
          { key: "where", label: hw(locale, "machines.col.where") },
        ]}
        rows={MACHINES.map((row) => ({
          key: row.id,
          fact: `machine.${row.id}`,
          source: row.source,
          group: tierName(row.tier),
          cells: {
            machine: nb(row.machine),
            price: (
              <span className="tw-font-semibold tw-text-iron-50">
                {nb(row.price)}
              </span>
            ),
            where: row.where ? nb(row.where) : "–",
          },
        }))}
      />
      <p className="tw-m-0 tw-mt-4 tw-max-w-[560px] tw-text-sm tw-leading-[22px] tw-text-iron-400">
        {hw(locale, "machines.note")}
      </p>
    </Disclosure>
  );
}

export default function TierSpecs({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-6">
      <SpecTable locale={locale} />
      <TierBlocks locale={locale} />
      <div className={`tw-max-w-[760px] tw-text-iron-300 ${READ}`}>
        <p className="tw-m-0">{hw(locale, "spec.systems")}</p>
        <ul className="tw-m-0 tw-mt-1.5 tw-flex tw-list-disc tw-flex-col tw-gap-1 tw-pl-5 marker:tw-text-iron-600">
          {(["os.linux", "os.mac", "os.windows"] as const).map((id) => (
            <li key={id}>
              <Hw id={id} locale={locale} />
            </li>
          ))}
        </ul>
      </div>
      <Machines locale={locale} />
    </div>
  );
}
