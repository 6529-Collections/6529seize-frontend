import type { ReactNode } from "react";
import { EdSection, FactsList } from "@/components/explained/reference/parts";
import {
  EX_FOCUS,
  EX_LAYOUT,
  EX_LINK,
  EX_TEXT,
} from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { hw, hwRich, hwTemplate, type HwSuffix } from "./_lib/copy";
import { CLOUD, NODE_NOTES, NODE_ROWS } from "./_lib/cloud";
import {
  MODE_ROWS,
  NODE_COST_AXIS,
  NODE_COST_BARS,
  USE_ROWS,
} from "./_lib/data";
import { Hw, nb, nbCode, Sourced, sourceText, sourceTitle } from "./_lib/facts";
import { SOURCES, type SourceId } from "./_lib/sources";
import CloudTable, { type ProviderMeta } from "./CloudTable";
import { Disclosure, FactTable, OpenMark, READ } from "./parts";
import TierSpecs from "./TierSpecs";

/**
 * The page's second half: the numbers behind the card. The tiers in full,
 * how each mode connects, instance types at nine providers, your own
 * Ethereum node, several machines under one account, what one validator
 * uses, and the questions operators ask.
 */
export const DETAIL_SECTIONS = [
  { id: "spec", label: "spec.label", title: "spec.title" },
  { id: "connections", label: "modes.label", title: "modes.title" },
  { id: "instance-types", label: "cloud.label", title: "cloud.title" },
  { id: "own-node", label: "node.label", title: "node.title" },
  { id: "several-machines", label: "holders.label", title: "holders.title" },
  { id: "what-it-uses", label: "use.label", title: "use.title" },
  { id: "questions", label: "faq.label", title: "faq.title" },
] as const satisfies readonly {
  readonly id: string;
  readonly label: HwSuffix;
  readonly title: HwSuffix;
}[];

type SectionId = (typeof DETAIL_SECTIONS)[number]["id"];

function Section({
  id,
  locale,
  children,
  full,
}: {
  readonly id: SectionId;
  readonly locale: SupportedLocale;
  readonly children?: ReactNode;
  readonly full?: ReactNode;
}) {
  const index = DETAIL_SECTIONS.findIndex((section) => section.id === id);
  const def = DETAIL_SECTIONS[index];
  if (!def) {
    throw new Error(`Unknown section "${id}"`);
  }
  return (
    <EdSection
      id={id}
      no={String(index + 1).padStart(2, "0")}
      label={hw(locale, def.label)}
      title={hw(locale, def.title)}
      tight
      {...(full === undefined
        ? {}
        : { full: <div className="tw-mt-6 md:tw-mt-8">{full}</div> })}
    >
      {children}
    </EdSection>
  );
}

function Para({ children }: { readonly children: ReactNode }) {
  return <p className={EX_LAYOUT.paragraph}>{children}</p>;
}

/** A source with its public page linked. */
function SourceLink({
  id,
  locale,
}: {
  readonly id: SourceId;
  readonly locale: SupportedLocale;
}) {
  const source = SOURCES[id];
  const text = sourceText(source, locale);
  // A source and its day are a fact of the page, like a price.
  const fact = `hw.source.${id}`;
  return "url" in source ? (
    <a
      className={EX_LINK}
      href={source.url}
      rel="noopener noreferrer"
      target="_blank"
      data-fact={fact}
      title={sourceTitle(id, locale)}
    >
      {text}
    </a>
  ) : (
    <span data-fact={fact} title={sourceTitle(id, locale)}>
      {text}
    </span>
  );
}

function Modes({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <Section
      id="connections"
      locale={locale}
      full={
        <FactTable
          locale={locale}
          caption={hw(locale, "modes.caption")}
          columns={[
            {
              key: "what",
              label: hw(locale, "modes.col.what"),
              width: "tw-w-[18%]",
            },
            {
              key: "home",
              label: hw(locale, "modes.col.home"),
              short: hw(locale, "modes.short.home"),
              width: "tw-w-[41%]",
            },
            {
              key: "rack",
              label: hw(locale, "modes.col.rack"),
              short: hw(locale, "modes.short.rack"),
            },
          ]}
          rows={MODE_ROWS.map((row) => ({
            key: row.id,
            fact: `mode.${row.id}`,
            source: "modes",
            cells: {
              what: hw(locale, `modes.row.${row.id}`),
              home: <span className="tw-text-iron-50">{nbCode(row.home)}</span>,
              rack: nbCode(row.rack),
            },
          }))}
        />
      }
    >
      <Para>{hw(locale, "modes.intro")}</Para>
    </Section>
  );
}

function Cloud({ locale }: { readonly locale: SupportedLocale }) {
  const meta: Record<string, ProviderMeta> = {};
  for (const provider of CLOUD) {
    meta[provider.id] = {
      title: sourceTitle(provider.source, locale),
      line: <SourceLink id={provider.source} locale={locale} />,
    };
  }
  const tips: readonly HwSuffix[] = [
    "cloud.tipArm",
    "cloud.tipBurst",
    "cloud.tipSpread",
  ];
  return (
    <Section
      id="instance-types"
      locale={locale}
      full={
        <>
          <CloudTable
            providers={CLOUD}
            meta={meta}
            allSource={{
              title: sourceTitle("cloudAll", locale),
              line: <SourceLink id="cloudAll" locale={locale} />,
            }}
            copy={{
              provider: hw(locale, "cloud.provider"),
              all: hw(locale, "cloud.all"),
              arch: hw(locale, "cloud.arch"),
              archAny: hw(locale, "cloud.archAny"),
              caption: hw(locale, "cloud.caption"),
              cols: {
                provider: hw(locale, "cloud.col.provider"),
                type: hw(locale, "cloud.col.type"),
                cpu: hw(locale, "cloud.col.cpu"),
                size: hw(locale, "cloud.col.size"),
                disk: hw(locale, "cloud.col.disk"),
                burst: hw(locale, "cloud.col.burst"),
                total: hw(locale, "cloud.col.total"),
              },
              machine: hwTemplate(locale, "cloud.machine"),
              cantOrder: hw(locale, "cloud.cantOrder"),
              none: hwTemplate(locale, "cloud.none"),
              region: hw(locale, "cloud.region"),
              source: hw(locale, "cloud.source"),
              allNote: hw(locale, "cloud.allNote"),
              showAll: hw(locale, "cloud.showAll"),
              showFewer: hw(locale, "cloud.showFewer"),
            }}
          />
          <div className="tw-mt-6 tw-scroll-mt-24" id="cloud-tips">
            <h3 className={`${EX_TEXT.label} tw-m-0`}>
              {hw(locale, "cloud.tips")}
            </h3>
            <ul className="tw-m-0 tw-mt-3 tw-grid tw-list-none tw-grid-cols-1 tw-items-start tw-gap-x-8 tw-gap-y-3 tw-p-0 md:tw-grid-cols-3">
              {tips.map((tip) => (
                <li
                  key={tip}
                  className={`tw-border-0 tw-border-l-2 tw-border-solid tw-border-iron-700 tw-pl-4 tw-text-iron-300 ${READ}`}
                >
                  {hw(locale, tip)}
                </li>
              ))}
            </ul>
          </div>
        </>
      }
    >
      <Para>
        {hwRich(locale, "cloud.intro", {
          egress: <Hw id="dc.cloud.egress" locale={locale} />,
        })}
      </Para>
    </Section>
  );
}

function NodeCosts({ locale }: { readonly locale: SupportedLocale }) {
  const pct = (value: number) => `${(value / NODE_COST_AXIS.max) * 100}%`;
  const dollars = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  return (
    <figure
      className="tw-m-0 tw-rounded-2xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5 md:tw-p-6"
      data-fig="node-costs"
      aria-label={hw(locale, "node.figure")}
    >
      <figcaption className="tw-m-0 tw-text-[15px] tw-font-semibold tw-leading-6 tw-text-iron-50 md:tw-text-base">
        {hw(locale, "node.figure")}
      </figcaption>
      <ul className="tw-m-0 tw-mt-5 tw-flex tw-list-none tw-flex-col tw-gap-5 tw-p-0">
        {NODE_COST_BARS.map((bar) => (
          <li
            key={bar.id}
            className="tw-grid tw-grid-cols-1 tw-gap-2 md:tw-grid-cols-[220px_minmax(0,1fr)] md:tw-items-center md:tw-gap-6"
          >
            <span>
              <span className="tw-block tw-text-[15px] tw-font-semibold tw-leading-6 tw-text-iron-50 md:tw-text-base">
                {hw(locale, `node.bar.${bar.id}`)}
              </span>
              <span className="tw-block tw-text-[13px] tw-leading-5 tw-text-iron-400">
                {hw(locale, `node.bar.${bar.id}Note`)}
              </span>
            </span>
            <span className="tw-relative tw-block tw-h-9">
              <span
                className="tw-absolute tw-inset-x-0 tw-top-1/2 tw-h-px tw-bg-iron-800"
                aria-hidden="true"
              />
              <span
                className={`tw-absolute tw-top-1/2 tw-h-3 tw--translate-y-1/2 tw-rounded-full ${bar.id === "home" ? "tw-bg-primary-400" : "tw-bg-iron-400"}`}
                style={{
                  left: pct(bar.low),
                  width: `max(12px, ${pct(bar.high - bar.low)})`,
                }}
                aria-hidden="true"
              />
              <span
                className="tw-absolute tw-top-1/2 tw--translate-y-1/2 tw-whitespace-nowrap tw-pl-3 tw-text-[15px] tw-font-semibold tw-text-iron-50 md:tw-text-base"
                style={
                  bar.high / NODE_COST_AXIS.max > 0.7
                    ? {
                        right: `calc(100% - ${pct(bar.low)})`,
                        paddingRight: "12px",
                      }
                    : { left: `calc(${pct(bar.high)} + 6px)` }
                }
              >
                <Hw id={bar.fact} locale={locale} />
              </span>
            </span>
          </li>
        ))}
      </ul>
      <div className="tw-mt-3 tw-hidden md:tw-grid md:tw-grid-cols-[220px_minmax(0,1fr)] md:tw-gap-6">
        <span aria-hidden="true" />
        <span className="tw-relative tw-block tw-h-5" aria-hidden="true">
          {NODE_COST_AXIS.ticks.map((tick, index, all) => {
            // The first label starts at the axis's left end and the last
            // ends at its right end; the rest are centred on their tick.
            const edge =
              index === 0
                ? ""
                : index === all.length - 1
                  ? "tw--translate-x-full"
                  : "tw--translate-x-1/2";
            return (
              <span
                key={tick}
                className={`tw-absolute tw-top-0 tw-text-xs tw-leading-5 tw-text-iron-400 ${edge}`}
                style={{ left: pct(tick) }}
              >
                {dollars.format(tick)}
              </span>
            );
          })}
        </span>
      </div>
    </figure>
  );
}

function OwnNode({ locale }: { readonly locale: SupportedLocale }) {
  const f = (id: Parameters<typeof Hw>[0]["id"]) => (
    <Hw id={id} locale={locale} />
  );
  return (
    <Section
      id="own-node"
      locale={locale}
      full={
        <div className="tw-flex tw-flex-col tw-gap-6">
          <NodeCosts locale={locale} />
          <Disclosure
            id="node-servers"
            summary={hwRich(locale, "node.servers", {
              date: <Hw id="read.day" locale={locale} />,
            })}
          >
            <FactTable
              locale={locale}
              caption={hw(locale, "node.caption")}
              columns={[
                {
                  key: "option",
                  label: hw(locale, "node.col.option"),
                  width: "tw-w-[22%]",
                },
                {
                  key: "spec",
                  label: hw(locale, "node.col.spec"),
                  width: "tw-w-[30%]",
                },
                {
                  key: "machine",
                  label: hw(locale, "node.col.machine"),
                  numeric: true,
                },
                {
                  key: "upload",
                  label: hw(locale, "node.col.upload"),
                  numeric: true,
                },
                {
                  key: "total",
                  label: hw(locale, "node.col.total"),
                  numeric: true,
                },
              ]}
              rows={NODE_ROWS.map((row) => ({
                key: row.id,
                fact: `node.${row.id}`,
                source: row.source,
                cells: {
                  option: nb(row.option),
                  spec: nb(row.spec),
                  machine: nb(row.machine),
                  upload: nb(row.upload),
                  total: (
                    <span className="tw-font-semibold tw-text-iron-50">
                      {nb(row.total)}
                    </span>
                  ),
                },
              }))}
            />
            <ul className="tw-m-0 tw-mt-4 tw-flex tw-max-w-[760px] tw-list-disc tw-flex-col tw-gap-1 tw-pl-4 tw-text-[15px] tw-leading-[22px] tw-text-iron-300 marker:tw-text-iron-600 md:tw-text-sm">
              {NODE_NOTES.map((note, index) => (
                <Sourced
                  key={note.text}
                  id={`node.note.${index + 1}`}
                  source={note.source}
                  locale={locale}
                  as="li"
                >
                  {nb(note.text)}
                </Sourced>
              ))}
            </ul>
            <p className="tw-m-0 tw-mt-2.5 tw-max-w-[520px] tw-text-[13px] tw-font-medium tw-leading-5 tw-text-iron-400">
              {hw(locale, "cloud.source")}:{" "}
              <SourceLink id="rented" locale={locale} />
              ; <SourceLink id="awsNode" locale={locale} />;{" "}
              <SourceLink id="azureNode" locale={locale} />
            </p>
          </Disclosure>
        </div>
      }
    >
      <Para>{hw(locale, "node.p1")}</Para>
      <Para>{hw(locale, "node.p2")}</Para>
      <div className="tw-mt-6 md:[&_dl]:tw-text-base md:[&_dl]:tw-leading-[26px]">
        <FactsList
          label={hw(locale, "node.needs")}
          rows={[
            {
              key: "storage",
              term: hw(locale, "node.storage"),
              value: hwRich(locale, "node.storageValue", {
                disk: f("node.disk"),
                db: f("node.db"),
                small: f("node.tooSmall"),
                by: f("node.tooSmallBy"),
              }),
            },
            {
              key: "memory",
              term: hw(locale, "node.memory"),
              value: f("node.ram"),
            },
            { key: "cpu", term: hw(locale, "node.cpu"), value: f("node.cpu") },
            {
              key: "internet",
              term: hw(locale, "node.internet"),
              value: hwRich(locale, "node.internetValue", {
                down: f("node.down"),
                up: f("node.up"),
                upload: f("node.upload"),
              }),
            },
            {
              key: "software",
              term: hw(locale, "node.software"),
              value: hwRich(locale, "node.softwareValue", {
                consensus: f("node.consensus"),
              }),
            },
            {
              key: "growth",
              term: hw(locale, "node.growth"),
              value: hwRich(locale, "node.growthValue", {
                year: f("node.growthYear"),
              }),
            },
          ]}
        />
      </div>
    </Section>
  );
}

function SeveralMachines({ locale }: { readonly locale: SupportedLocale }) {
  const items: readonly { key: HwSuffix; body: ReactNode }[] = [
    { key: "holders.plan", body: hw(locale, "holders.plan") },
    {
      key: "holders.grant",
      body: hwRich(locale, "holders.grant", {
        keys: <Hw id="holders.keys" locale={locale} />,
        syntax: (
          <code className="tw-whitespace-nowrap tw-rounded-md tw-bg-iron-900 tw-px-1.5 tw-py-0.5 tw-font-mono tw-text-[0.875em] tw-text-iron-50">
            --key KEY_ID:3
          </code>
        ),
      }),
    },
    { key: "holders.down", body: hw(locale, "holders.down") },
    { key: "holders.backup", body: hw(locale, "holders.backup") },
    { key: "holders.wallet", body: hw(locale, "holders.wallet") },
  ];
  return (
    <Section id="several-machines" locale={locale}>
      {items.map((item) => (
        <Para key={item.key}>{item.body}</Para>
      ))}
    </Section>
  );
}

function Uses({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <Section
      id="what-it-uses"
      locale={locale}
      full={
        <FactTable
          locale={locale}
          caption={hw(locale, "use.caption")}
          columns={[
            {
              key: "what",
              label: hw(locale, "use.col.what"),
              width: "tw-w-[34%] lg:tw-w-[28%]",
            },
            { key: "value", label: hw(locale, "use.col.value") },
          ]}
          stack={false}
          rows={USE_ROWS.map((row) => ({
            key: row.id,
            fact: `use.${row.id}`,
            source: row.source,
            cells: {
              what: hw(locale, `use.row.${row.id}`),
              value: <span className="tw-text-iron-50">{nb(row.value)}</span>,
            },
          }))}
        />
      }
    >
      <Para>
        {hwRich(locale, "use.intro", {
          link: (
            <a href="#parts" className={EX_LINK}>
              {hw(locale, "parts.kicker")}
            </a>
          ),
        })}
      </Para>
    </Section>
  );
}

function Questions({ locale }: { readonly locale: SupportedLocale }) {
  const f = (id: Parameters<typeof Hw>[0]["id"]) => (
    <Hw id={id} locale={locale} />
  );
  const faqs: readonly { id: string; q: HwSuffix; a: ReactNode }[] = [
    {
      id: "off",
      q: "faq.off.q",
      a: hwRich(locale, "faq.off.a", {
        open: f("use.windowOpen"),
        close: f("use.windowClose"),
      }),
    },
    { id: "node", q: "faq.node.q", a: hw(locale, "faq.node.a") },
    { id: "eth", q: "faq.eth.q", a: hw(locale, "faq.eth.a") },
    {
      id: "internet",
      q: "faq.internet.q",
      a: hwRich(locale, "faq.internet.a", { wire: f("use.wire") }),
    },
    { id: "address", q: "faq.address.q", a: hw(locale, "faq.address.a") },
    {
      id: "pi",
      q: "faq.pi.q",
      a: hwRich(locale, "faq.pi.a", {
        ram: f("spec.acceptable.ram"),
        min: f("spec.pi.min"),
        os: f("os.pi"),
      }),
    },
    {
      id: "os",
      q: "faq.os.q",
      a: hwRich(locale, "faq.os.a", {
        mac: f("os.mac"),
        windows: f("os.windows"),
        link: (
          <a href="#part-power" className={EX_LINK}>
            {hw(locale, "parts.name.power")}
          </a>
        ),
      }),
    },
    { id: "wifi", q: "faq.wifi.q", a: hw(locale, "faq.wifi.a") },
    {
      id: "cloud",
      q: "faq.cloud.q",
      a: hwRich(locale, "faq.cloud.a", {
        link: (
          <a href="#cloud-tips" className={EX_LINK}>
            {hw(locale, "faq.cloud.link")}
          </a>
        ),
      }),
    },
    {
      id: "oracle",
      q: "faq.oracle.q",
      a: hwRich(locale, "faq.oracle.a", {
        free: f("oracle.free"),
        halved: f("oracle.halvedOn"),
        paygSize: f("oracle.paygSize"),
        payg: f("oracle.payg"),
      }),
    },
    {
      id: "bill",
      q: "faq.bill.q",
      a: hwRich(locale, "faq.bill.a", { upload: f("use.upload") }),
    },
  ];
  return (
    <Section id="questions" locale={locale}>
      <div className="tw-border-0 tw-border-b tw-border-solid tw-border-iron-900">
        {faqs.map((faq, index) => (
          <details
            key={faq.id}
            open={index === 0}
            data-faq={faq.id}
            className="tw-group tw-border-0 tw-border-t tw-border-solid tw-border-iron-900"
          >
            <summary
              className={`tw-flex tw-min-h-11 tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-3 tw-py-4 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50 [&::-webkit-details-marker]:tw-hidden ${EX_FOCUS}`}
            >
              <span>{hw(locale, faq.q)}</span>
              <OpenMark />
            </summary>
            <p className="tw-m-0 tw-hidden tw-max-w-[660px] tw-pb-4 tw-text-[15px] tw-leading-6 tw-text-iron-300 group-open:tw-block md:tw-text-lg md:tw-leading-[29px]">
              {faq.a}
            </p>
          </details>
        ))}
      </div>
    </Section>
  );
}

export default function Detail({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <>
      <Section id="spec" locale={locale} full={<TierSpecs locale={locale} />} />
      <Modes locale={locale} />
      <Cloud locale={locale} />
      <OwnNode locale={locale} />
      <SeveralMachines locale={locale} />
      <Uses locale={locale} />
      <Questions locale={locale} />
    </>
  );
}
