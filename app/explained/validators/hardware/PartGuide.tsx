import { EX_FOCUS, EX_LAYOUT, EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { CARD } from "./_lib/card";
import { hw, hwRich } from "./_lib/copy";
import { Hw, nb, Sourced } from "./_lib/facts";
import {
  DRIVES,
  IDLE,
  PART_TIERS,
  PARTS,
  SLEEP,
  SPEND,
  type PartTier,
  type Said,
} from "./_lib/partGuide";
import CopyCommand from "./CopyCommand";
import { CardHead, FactTable, OpenMark, READ } from "./parts";

/**
 * Part by part: one row per part of the machine, the answer first ("Graphics
 * card (GPU): Not needed."), and behind it what the validator uses, what to
 * get at each tier and what not to buy. Storage adds the drive types, power
 * the idle draws. Then where extra money helps, in order. It sits after the
 * card's tiers and before the provider tables.
 */
type Part = (typeof PARTS)[number];

const LABEL =
  "tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.12em] tw-text-iron-400";

function tierName(tier: PartTier): string {
  return tier === "rack" || tier === "cloud"
    ? CARD.dc[tier].name
    : CARD.tiers[tier].name;
}

function Line({
  id,
  said,
  locale,
  className,
  as = "span",
}: {
  readonly id: string;
  readonly said: Said;
  readonly locale: SupportedLocale;
  readonly className?: string;
  readonly as?: "span" | "li" | "p";
}) {
  return (
    <Sourced
      id={id}
      source={said.source}
      locale={locale}
      as={as}
      {...(className === undefined ? {} : { className })}
    >
      {nb(said.text)}
    </Sourced>
  );
}

function Tiers({
  part,
  locale,
}: {
  readonly part: Part;
  readonly locale: SupportedLocale;
}) {
  const base = `part.${part.id}.tier`;
  if ("text" in part.tiers) {
    return (
      <dl className="tw-m-0">
        <div className="tw-py-2.5 sm:tw-grid sm:tw-grid-cols-[136px_minmax(0,1fr)] sm:tw-gap-x-4">
          <dt className={`tw-font-semibold tw-text-iron-50 ${READ}`}>
            {hw(locale, "parts.everyTier")}
          </dt>
          <dd className={`tw-m-0 tw-text-iron-300 ${READ}`}>
            <Line id={`${base}.all`} said={part.tiers} locale={locale} />
          </dd>
        </div>
      </dl>
    );
  }
  const tiers = part.tiers;
  return (
    <dl className="tw-m-0">
      {PART_TIERS.map((tier) => {
        const good = tier === "good";
        return (
          <div
            key={tier}
            className={`tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-2.5 last:tw-border-b-0 sm:tw-grid sm:tw-grid-cols-[136px_minmax(0,1fr)] sm:tw-gap-x-4 ${good ? "-tw-mx-3 tw-rounded-lg tw-border-transparent tw-bg-primary-400/[0.08] tw-px-3" : ""}`}
          >
            <dt
              className={`tw-flex tw-flex-wrap tw-content-start tw-items-center tw-gap-x-2 tw-gap-y-1 tw-font-semibold tw-text-iron-50 ${READ}`}
            >
              {tierName(tier)}
              {good && (
                <span className="tw-rounded-full tw-bg-primary-500 tw-px-2 tw-py-px tw-text-[12px] tw-font-bold tw-uppercase tw-leading-4 tw-tracking-[0.08em] tw-text-white">
                  {CARD.recommended}
                </span>
              )}
            </dt>
            <dd
              className={`tw-m-0 tw-mt-0.5 tw-text-iron-300 sm:tw-mt-0 ${READ}`}
            >
              <Line
                id={`${base}.${tier}`}
                said={tiers[tier]}
                locale={locale}
                {...(good ? { className: "tw-text-iron-50" } : {})}
              />
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function Drives({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <div className="tw-mt-6">
      <p className={LABEL}>{hw(locale, "parts.drives.title")}</p>
      <div className="tw-mt-2">
        <FactTable
          locale={locale}
          caption={hw(locale, "parts.drives.title")}
          columns={[
            {
              key: "drive",
              label: hw(locale, "parts.drives.col.drive"),
              width: "tw-w-[24%]",
            },
            {
              key: "alone",
              label: hw(locale, "parts.drives.col.alone"),
              short: hw(locale, "parts.drives.short.alone"),
              width: "tw-w-[38%]",
            },
            {
              key: "node",
              label: hw(locale, "parts.drives.col.node"),
              short: hw(locale, "parts.drives.short.node"),
            },
          ]}
          rows={DRIVES.map((row) => ({
            key: row.id,
            fact: `drive.${row.id}`,
            source: row.source,
            cells: {
              drive: row.drive,
              alone: <span className="tw-text-iron-50">{nb(row.alone)}</span>,
              node: nb(row.node),
            },
          }))}
        />
      </div>
    </div>
  );
}

function Idle({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <div className="tw-mt-6 lg:tw-grid lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:tw-gap-x-10">
      <div>
        <p className={LABEL}>{hw(locale, "parts.idle.title")}</p>
        <div className="tw-mt-2">
          <FactTable
            locale={locale}
            caption={hw(locale, "parts.idle.title")}
            stack={false}
            columns={[
              {
                key: "machine",
                label: hw(locale, "parts.idle.col.machine"),
                width: "tw-w-[46%]",
              },
              {
                key: "watts",
                label: hw(locale, "parts.idle.col.watts"),
                numeric: true,
              },
              {
                key: "year",
                label: hw(locale, "parts.idle.col.year"),
                numeric: true,
              },
            ]}
            rows={IDLE.map((row) => ({
              key: row.id,
              fact: `idle.${row.id}`,
              source: "power",
              cells: {
                machine: row.machine,
                watts: (
                  <span className="tw-whitespace-nowrap">{row.watts}</span>
                ),
                year: (
                  <span className="tw-whitespace-nowrap tw-font-semibold tw-text-iron-50">
                    {row.year}
                  </span>
                ),
              },
            }))}
          />
          <p className="tw-m-0 tw-mt-2.5 tw-text-[13px] tw-font-medium tw-leading-5 tw-text-iron-400">
            {hwRich(locale, "parts.idle.basis", {
              kwh: <Hw id="power.kwh" locale={locale} />,
            })}
          </p>
        </div>
      </div>
      <div className="tw-mt-6 lg:tw-mt-0">
        <p className={LABEL}>{hw(locale, "parts.sleep")}</p>
        <Sourced
          id="part.power.sleep"
          source="sleep"
          locale={locale}
          as="div"
          className="tw-mt-3"
        >
          {SLEEP.map((row) => (
            <div
              key={row.os}
              className={`tw-mb-4 tw-text-iron-300 last:tw-mb-0 ${READ}`}
            >
              <span className="tw-block tw-font-semibold tw-text-iron-50">
                {row.os}
              </span>
              {row.cmds.map((cmd) => (
                <CopyCommand
                  key={cmd}
                  cmd={cmd}
                  label={hw(locale, "parts.copy")}
                  copied={hw(locale, "parts.copied")}
                />
              ))}
              {row.note !== undefined && (
                <span className="tw-mt-1.5 tw-block tw-text-iron-400">
                  {row.note}
                </span>
              )}
            </div>
          ))}
        </Sourced>
      </div>
    </div>
  );
}

function PartRow({
  part,
  locale,
}: {
  readonly part: Part;
  readonly locale: SupportedLocale;
}) {
  const base = `part.${part.id}`;
  return (
    <details
      id={`part-${part.id}`}
      data-part={part.id}
      className="tw-group tw-scroll-mt-24 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 first:tw-border-t-0"
    >
      <summary
        className={`tw-grid tw-cursor-pointer tw-list-none tw-grid-cols-[minmax(0,1fr)_28px] tw-gap-x-4 tw-gap-y-1.5 tw-px-5 tw-py-4 md:tw-px-6 lg:tw-grid-cols-[208px_minmax(0,1fr)_28px] lg:tw-gap-x-8 lg:tw-py-5 [&::-webkit-details-marker]:tw-hidden ${EX_FOCUS}`}
      >
        <span className="tw-col-start-1 tw-row-start-1 tw-text-xs tw-font-semibold tw-uppercase tw-leading-5 tw-tracking-[0.12em] tw-text-iron-400 lg:tw-pt-0.5 lg:tw-text-[15px] lg:tw-normal-case lg:tw-leading-6 lg:tw-tracking-normal lg:tw-text-iron-300">
          {hw(locale, `parts.name.${part.id}`)}
        </span>
        <span className="tw-col-start-1 tw-row-start-2 lg:tw-col-start-2 lg:tw-row-start-1">
          <Line
            id={`${base}.answer`}
            said={part.answer}
            locale={locale}
            className="tw-block tw-text-[17px] tw-font-semibold tw-leading-6 tw-tracking-[-0.01em] tw-text-iron-50 md:tw-text-lg md:tw-leading-7"
          />
          <Line
            id={`${base}.why`}
            said={part.why}
            locale={locale}
            className={`tw-mt-0.5 tw-block tw-text-iron-300 ${READ}`}
          />
        </span>
        <OpenMark className="tw-col-start-2 tw-row-span-2 tw-row-start-1 tw-self-start lg:tw-col-start-3 lg:tw-row-span-1" />
      </summary>
      <div className="tw-hidden tw-px-5 tw-pb-6 group-open:tw-block md:tw-px-6">
        <div className="tw-grid tw-grid-cols-1 tw-gap-6 tw-border-0 tw-border-t tw-border-solid tw-border-iron-900 tw-pt-5 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:tw-gap-x-10">
          <div>
            <p className={LABEL}>{hw(locale, "parts.uses")}</p>
            <ul className="tw-m-0 tw-mt-3 tw-flex tw-list-none tw-flex-col tw-gap-2.5 tw-p-0">
              {part.uses.map((said, index) => (
                <Line
                  key={said.text}
                  id={`${base}.uses.${index + 1}`}
                  said={said}
                  locale={locale}
                  as="li"
                  className={`tw-relative tw-pl-4 tw-text-iron-300 before:tw-absolute before:tw-left-0 before:tw-top-[10px] before:tw-size-1.5 before:tw-rounded-full before:tw-bg-iron-600 before:tw-content-[''] md:before:tw-top-[11px] ${READ}`}
                />
              ))}
            </ul>
          </div>
          <div className="tw-order-first lg:tw-order-none">
            <p className={LABEL}>{hw(locale, "parts.tiers")}</p>
            <div className="tw-mt-1.5">
              <Tiers part={part} locale={locale} />
            </div>
          </div>
        </div>
        {part.id === "storage" && <Drives locale={locale} />}
        {part.id === "power" && <Idle locale={locale} />}
        {part.avoid !== undefined && (
          <div className="tw-mt-6 tw-border-0 tw-border-l-2 tw-border-solid tw-border-error/50 tw-pl-4">
            <p className={`${LABEL} tw-text-error`}>
              {hw(locale, "parts.avoid")}
            </p>
            <Line
              id={`${base}.avoid`}
              said={part.avoid}
              locale={locale}
              as="p"
              className={`tw-m-0 tw-mt-1.5 tw-text-iron-300 ${READ}`}
            />
          </div>
        )}
      </div>
    </details>
  );
}

function Spend({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <div className="tw-mt-6 tw-rounded-2xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5 md:tw-p-6">
      <h3 className={`${EX_TEXT.h4} tw-m-0`}>
        {hw(locale, "parts.spend.title")}
      </h3>
      <ol className="tw-m-0 tw-mt-4 tw-grid tw-list-none tw-grid-cols-1 tw-gap-3 tw-p-0 sm:tw-grid-cols-2 lg:tw-grid-cols-5 lg:tw-gap-4">
        {SPEND.map((said, index) => (
          <li
            key={said.text}
            className="tw-flex tw-items-start tw-gap-3 lg:tw-flex-col lg:tw-gap-2.5"
          >
            <span
              className="tw-grid tw-size-7 tw-flex-none tw-place-items-center tw-rounded-lg tw-border tw-border-solid tw-border-primary-300/30 tw-bg-primary-400/[0.12] tw-text-sm tw-font-bold tw-text-primary-300"
              aria-hidden="true"
              data-ex-allow-number=""
            >
              {index + 1}
            </span>
            <Line
              id={`spend.${index + 1}`}
              said={said}
              locale={locale}
              className={`tw-pt-0.5 tw-text-iron-50 lg:tw-pt-0 ${READ}`}
            />
          </li>
        ))}
      </ol>
      <p className={`tw-m-0 tw-mt-5 tw-max-w-[760px] tw-text-iron-300 ${READ}`}>
        {hw(locale, "parts.spend.node")} {hw(locale, "parts.spend.never")}
      </p>
    </div>
  );
}

export default function PartGuide({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <section
      aria-labelledby="parts-title"
      className={`${EX_LAYOUT.sectionTight} tw-scroll-mt-24`}
      id="parts"
    >
      <CardHead
        id="parts-title"
        kicker={hw(locale, "parts.kicker")}
        title={hw(locale, "parts.title")}
        note={hwRich(locale, "parts.note", {
          date: <Hw id="read.day" locale={locale} />,
        })}
      />
      <div
        className="tw-rounded-2xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950"
        data-parts=""
      >
        {PARTS.map((part) => (
          <PartRow key={part.id} part={part} locale={locale} />
        ))}
      </div>
      <Spend locale={locale} />
    </section>
  );
}
