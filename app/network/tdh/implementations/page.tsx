import type { Metadata } from "next";
import Link from "next/link";
import { getAppMetadata } from "@/components/providers/metadata";
import { kt } from "@/components/explained/i18n";
import Mark from "@/components/explained/marks/Mark";
import ExplainedShell from "@/components/explained/shell/ExplainedShell";
import HowWeKnow from "@/components/explained/shell/HowWeKnow";
import { EX_BUTTON, EX_LINK, EX_TEXT } from "@/components/explained/tokens";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { loadFactBook } from "@/lib/explained/feed.server";
import { factText, type FactBook } from "@/lib/explained/facts";
import CopyButton from "@/components/explained/reference/CopyButton";
import ImplAnchors from "./ImplAnchors";
import { PlaceLinks, pagePlace } from "@/components/explained/shell/place";
import {
  Caption,
  CodeBlock,
  CodeName,
  Contents,
  EdSection,
  PageHead,
  Prose,
  StackTable,
  Trap,
} from "@/components/explained/reference/parts";
import { FactScope, FactText } from "@/components/explained/facts/FactText";
import {
  isMessageKey,
  plain,
  rich,
  type RichValues,
} from "@/components/explained/rich";
import { printers } from "@/components/explained/facts/printers";

/**
 * Shelf S2, Implementations and vectors (TDH-DESIGN.md §4.7): the six
 * programs, the vectors (P26's count and the served manifest's, labelled),
 * the five public vectors as JSON, how to run one, the pin block of the
 * latest day with its roots, the owner ask, and the difftest rounds.
 */
export const revalidate = 600;

type ImplKey = Extract<MessageKey, `explained.tdh.impl.${string}`>;

const SERVED_VECTORS = "manifest.vectors.total";
const P26_VECTORS = "rules.vectors";
const LATEST_CYCLE = "tdh.latest.cycle";
const REPORTED_RULE_VERSION = "tdh.latest.ruleVersion";

/** The public vectors' download (app/network/tdh/public-vectors.json). */
const PUBLIC_VECTORS_HREF = "/network/tdh/public-vectors.json";

function pinBlock(book: FactBook, comment: string, retired: string | null) {
  const raw = (id: Parameters<FactBook["text"]>[0]) =>
    book.maybe(id) ? factText(book.get(id)) : "-";
  const contracts = [
    `memes ${raw("rules.contract.memes")}`,
    `gradients ${raw("rules.contract.gradients")}`,
    `nextgen ${raw("rules.contract.nextgen")}`,
    // The fourth contract whose logs count, and the fifth whose state is
    // read (P26 §2): links between wallets, and the Memes' claim limits.
    `delegation ${raw("rules.contract.delegation")}`,
    `claim ${raw("rules.contract.claim")}`,
  ];
  const line = (name: string, value: string) => `${name.padEnd(15)}${value}`;
  return [
    `# ${comment}`,
    retired
      ? `${line("rule_version", raw(REPORTED_RULE_VERSION))}   # ${retired}`
      : line("rule_version", raw(REPORTED_RULE_VERSION)),
    line("registry_hash", raw("tdh.latest.registry")),
    line("rule_id", raw("tdh.latest.ruleId")),
    line("cutoff_block", raw("tdh.latest.cutoff")),
    line("contracts", contracts.join("\n               ")),
    line("cycle_root", raw("tdh.latest.roots.cycle")),
    line("wallet_root", raw("tdh.latest.roots.wallet")),
    line("input_sha256", raw("tdh.latest.inputSha")),
  ].join("\n");
}

export default async function ImplementationsPage() {
  const locale = DEFAULT_LOCALE;
  const book = await loadFactBook();
  const place = pagePlace("tdh", "impl", locale);
  const p = printers(book, locale);
  const m = (key: ImplKey, values?: RichValues) => rich(locale, key, values);
  const s = (
    key: ImplKey,
    params?: Readonly<Record<string, string | number>>
  ) => plain(locale, key, params);
  const served = p.num(SERVED_VECTORS);
  const p26 = p.num(P26_VECTORS);
  let servedLine = m("explained.tdh.impl.vectors.servedAll");
  if (served !== null && p26 !== null && served < p26) {
    servedLine = m("explained.tdh.impl.vectors.servedBehind", {
      served: p.v(SERVED_VECTORS),
      spec: <CodeName>{p.v("manifest.specCommit")}</CodeName>,
    });
  } else if (served !== null && p26 !== null && served > p26) {
    servedLine = m("explained.tdh.impl.vectors.servedAhead", {
      served: p.v(SERVED_VECTORS),
      spec: <CodeName>{p.v("manifest.specCommit")}</CodeName>,
    });
  }
  const publicIds = book.maybe<string[]>("vectors.public")?.value ?? [];
  const reported = p.text(REPORTED_RULE_VERSION);
  const current = p.text("rules.version");
  const block = pinBlock(
    book,
    s("explained.tdh.impl.roots.comment", {
      date: p.f("tdh.latest.date", "long"),
      cycle: p.f(LATEST_CYCLE),
    }),
    reported !== null && current !== null && reported !== current
      ? s("explained.tdh.impl.roots.retired", { current })
      : null
  );
  const programsFact = book.maybe("site.proofA.cycle");
  const code = (name: string) => <CodeName wrap>{name}</CodeName>;
  const program = (name: ImplKey, sub?: ImplKey) => (
    <>
      {m(name)}
      {sub && (
        <span className={`tw-block tw-font-normal ${EX_TEXT.cap}`}>
          {m(sub)}
        </span>
      )}
    </>
  );
  return (
    <ExplainedShell
      chapter="tdh"
      page="impl"
      crumbs={[
        { label: kt(locale, "explained.kit.map.hub"), href: "/explained" },
        {
          label: kt(locale, "explained.kit.map.chapterTitle", {
            number: place.chapterNumber,
            title: kt(locale, "explained.kit.map.tdh"),
          }),
          href: "/network/tdh",
        },
        { label: t(locale, "explained.tdh.impl.crumb") },
      ]}
      live={{ fact: book.maybe("feed.writtenAt"), kind: "feed" }}
      facts={book.snapshot()}
      locale={locale}
    >
      <ImplAnchors />
      <article data-ex-article="" lang={locale}>
        <PageHead
          eyebrow={m("explained.tdh.impl.eyebrow", {
            n: <span>{place.n}</span>,
          })}
          title={m("explained.tdh.impl.title")}
          lede={m("explained.tdh.impl.lede")}
        >
          <div className="tw-mt-8 tw-max-w-[760px]">
            <Contents
              label={s("explained.tdh.impl.toc.label")}
              items={[
                {
                  href: "#cast",
                  no: "1",
                  title: m("explained.tdh.impl.toc.cast"),
                },
                {
                  href: "#vectors",
                  no: "2",
                  title: m("explained.tdh.impl.toc.vectors"),
                },
                {
                  href: "#roots",
                  no: "3",
                  title: m("explained.tdh.impl.toc.roots"),
                },
                {
                  href: "#difftest-rounds",
                  no: "4",
                  title: m("explained.tdh.impl.toc.rounds"),
                },
              ]}
            />
          </div>
        </PageHead>

        <EdSection
          id="cast"
          no="1"
          label={m("explained.tdh.impl.cast.label")}
          title={m("explained.tdh.impl.cast.title")}
        >
          <Prose>{m("explained.tdh.impl.cast.body")}</Prose>
          <div className="tw-mt-6">
            <StackTable
              from="lg"
              caption={s("explained.tdh.impl.cast.caption")}
              columns={[
                { key: "program", label: s("explained.tdh.impl.col.program") },
                { key: "written", label: s("explained.tdh.impl.col.written") },
                { key: "runs", label: s("explained.tdh.impl.col.runs") },
                { key: "proved", label: s("explained.tdh.impl.col.proved") },
              ]}
              rows={[
                {
                  key: "a",
                  cells: {
                    program: program(
                      "explained.tdh.impl.a.name",
                      "explained.tdh.impl.a.sub"
                    ),
                    written: m("explained.tdh.impl.a.written"),
                    runs:
                      book.maybe("tdh.cutover.checkedAt") === null
                        ? m("explained.tdh.impl.a.runs")
                        : m("explained.tdh.impl.a.runsLate", {
                            checked: p.v("tdh.cutover.checkedAt"),
                          }),
                    proved: (
                      <Mark
                        kind={programsFact ? "proved" : "notYet"}
                        locale={locale}
                        size="sm"
                        label={s("explained.tdh.impl.a.proof")}
                        refText={s("explained.tdh.impl.a.proofRef")}
                      />
                    ),
                  },
                },
                {
                  key: "b",
                  cells: {
                    program: program("explained.tdh.impl.b.name"),
                    written: m("explained.tdh.impl.b.written"),
                    runs: m("explained.tdh.impl.b.runs"),
                    proved: (
                      <Mark
                        kind="notYet"
                        locale={locale}
                        size="sm"
                        label={s("explained.tdh.impl.b.proof")}
                        refText={s("explained.tdh.impl.b.proofRef")}
                      />
                    ),
                  },
                },
                {
                  key: "python",
                  cells: {
                    program: program("explained.tdh.impl.python.name"),
                    written: m("explained.tdh.impl.python.written"),
                    runs: m("explained.tdh.impl.python.runs"),
                  },
                },
                {
                  key: "rustRef",
                  cells: {
                    program: program("explained.tdh.impl.rustRef.name"),
                    written: m("explained.tdh.impl.rustRef.written", {
                      choices: p.v("programs.cleanRoomChoices"),
                    }),
                    runs: m("explained.tdh.impl.rustRef.runs"),
                  },
                },
                {
                  key: "lean",
                  cells: {
                    program: program("explained.tdh.impl.lean.name"),
                    written: m("explained.tdh.impl.lean.written"),
                    runs: m("explained.tdh.impl.lean.runs", {
                      day: p.v("model.replayDay"),
                      random: p.v("programs.randomPerChange"),
                    }),
                    proved: m("explained.tdh.impl.lean.proved", {
                      count: p.v("manifest.proved"),
                    }),
                  },
                },
                {
                  key: "live",
                  cells: {
                    program: program("explained.tdh.impl.live.name"),
                    written: m("explained.tdh.impl.live.written"),
                    runs: m("explained.tdh.impl.live.runs"),
                  },
                },
              ]}
            />
          </div>
          <Caption className="tw-mt-3">
            {m("explained.tdh.impl.cast.note", {
              time: p.v("programs.rustReference.time"),
              day: p.v("model.replayDay"),
              runtime: p.v("tdh.latest.builds.rust.runtime"),
            })}
          </Caption>
        </EdSection>

        <EdSection
          id="vectors"
          no="2"
          label={m("explained.tdh.impl.vectors.label")}
          title={m("explained.tdh.impl.vectors.title", {
            count: p.v(P26_VECTORS),
          })}
        >
          <Prose>
            {m("explained.tdh.impl.vectors.body", {
              count: p.v(P26_VECTORS),
              date: p.v("rules.p26Date"),
              served: servedLine,
              public: p.v("vectors.public.count"),
            })}
          </Prose>
          <div className="tw-mt-6 tw-grid tw-grid-cols-1 tw-gap-6 md:tw-grid-cols-2">
            <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-px-[22px] tw-py-5">
              <span className={EX_TEXT.label}>
                {m("explained.tdh.impl.public.label")}
              </span>
              <dl
                className="tw-m-0 tw-mt-3 tw-grid tw-grid-cols-[36px_minmax(0,1fr)] tw-text-[15px] tw-leading-6"
                aria-label={s("explained.tdh.impl.public.list")}
              >
                {publicIds.map((id) => {
                  const key = `explained.tdh.impl.public.${id}`;
                  return (
                    <div key={id} className="tw-contents">
                      <dt className="tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-2.5 tw-font-semibold tw-text-iron-400">
                        {id.split("-")[0]}
                      </dt>
                      <dd className="tw-m-0 tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-2.5 tw-text-iron-50">
                        {isMessageKey(key) ? (
                          m(key as ImplKey)
                        ) : (
                          <CodeName>{id}</CodeName>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
              <a
                className={`${EX_BUTTON.secondary} tw-mt-4`}
                href={PUBLIC_VECTORS_HREF}
                download
                aria-label={s("explained.tdh.impl.public.downloadLabel")}
              >
                {m("explained.tdh.impl.public.download")}
              </a>
            </div>
            <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-px-[22px] tw-py-5">
              <span className={EX_TEXT.label}>
                {m("explained.tdh.impl.run.label")}
              </span>
              <ol className="tw-m-0 tw-mt-3 tw-grid tw-list-none tw-gap-2.5 tw-p-0">
                {[
                  m("explained.tdh.impl.run.read", {
                    params: code("params"),
                    cycle: code("cycle"),
                    transfers: code("transfers"),
                    events: code("consolidation_events"),
                    logs: code("raw_logs"),
                  }),
                  m("explained.tdh.impl.run.compare", {
                    expected: code("expected"),
                    legacy: code("legacy_expected"),
                  }),
                  m("explained.tdh.impl.run.invalid", {
                    invalid: code("expected_invalid"),
                  }),
                ].map((step, index) => (
                  <li
                    // The steps are fixed copy in a fixed order.
                    key={index}
                    className="tw-relative tw-pl-[42px] tw-text-[15px] tw-leading-6 tw-text-iron-300"
                  >
                    <span
                      aria-hidden="true"
                      className="tw-absolute tw-left-0 tw-top-0 tw-grid tw-size-[30px] tw-place-items-center tw-rounded-full tw-border-[1.5px] tw-border-solid tw-border-primary-400 tw-text-sm tw-font-bold tw-text-primary-300"
                    >
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </EdSection>

        <EdSection
          id="roots"
          no="3"
          label={m("explained.tdh.impl.roots.label")}
          title={m("explained.tdh.impl.roots.title", {
            date: p.v("tdh.latest.date"),
          })}
        >
          <FactScope
            ids={[
              REPORTED_RULE_VERSION,
              "tdh.latest.registry",
              "tdh.latest.ruleId",
              "tdh.latest.cutoff",
              "tdh.latest.roots.cycle",
              "tdh.latest.roots.wallet",
              "tdh.latest.inputSha",
            ]}
          >
            <CodeBlock
              code={block}
              label={s("explained.tdh.impl.roots.blockLabel", {
                date: p.f("tdh.latest.date", "long"),
              })}
            />
          </FactScope>
          <div className="tw-mt-3.5 tw-flex tw-flex-wrap tw-items-center tw-gap-x-5 tw-gap-y-2">
            <CopyButton
              text={block}
              label={s("explained.tdh.impl.roots.copy")}
              copiedLabel={s("explained.tdh.impl.roots.copied")}
            />
            <Link
              className={EX_BUTTON.link}
              href={`/network/tdh/verification/${p.num(LATEST_CYCLE) ?? ""}`}
            >
              {m("explained.tdh.impl.roots.receipt")}
            </Link>
          </div>
          <Prose className="tw-mt-6">
            {m("explained.tdh.impl.roots.body")}
          </Prose>
          <Trap className="tw-mt-4" label={m("explained.tdh.impl.ask.label")}>
            {m("explained.tdh.impl.ask.body")}
          </Trap>
        </EdSection>

        <EdSection
          id="difftest-rounds"
          no="4"
          label={m("explained.tdh.impl.rounds.label")}
          title={m("explained.tdh.impl.rounds.title", {
            rounds: p.v("difftest.rounds"),
          })}
        >
          <Prose>
            {m("explained.tdh.impl.rounds.body", {
              from: p.v("difftest.from"),
              to: p.v("difftest.to"),
              rounds: p.v("difftest.rounds"),
              open: p.v("difftest.open"),
              random: p.v("programs.randomPerChange"),
            })}
          </Prose>
        </EdSection>

        <PlaceLinks place={place} locale={locale} />
        <HowWeKnow
          locale={locale}
          title={t(locale, "explained.tdh.impl.title")}
          slug="tdh-implementations"
          rows={[
            {
              title: s("explained.tdh.impl.hwk.programs"),
              body: m("explained.tdh.impl.hwk.programsBody", {
                source: (
                  <FactText
                    fact={book.maybe("programs.cleanRoomChoices")}
                    locale={locale}
                  >
                    {book.maybe("programs.cleanRoomChoices")?.source.ref}
                  </FactText>
                ),
              }),
            },
            {
              title: s("explained.tdh.impl.hwk.vectors"),
              body: m("explained.tdh.impl.hwk.vectorsBody", {
                commit: p.v("rules.p26Commit"),
                count: p.v(P26_VECTORS),
                passed: p.v("manifest.vectors.passed"),
                total: p.v(SERVED_VECTORS),
              }),
            },
            {
              title: s("explained.tdh.impl.hwk.day"),
              body: m("explained.tdh.impl.hwk.dayBody", {
                file: (
                  <a
                    className={EX_LINK}
                    href={p.text("tdh.latest.file.url") ?? "#roots"}
                  >
                    <FactText fact={book.maybe(LATEST_CYCLE)} locale={locale}>
                      {`days/${p.num(LATEST_CYCLE) ?? ""}.json`}
                    </FactText>
                  </a>
                ),
                written: p.v("tdh.latest.writtenAt", "long"),
              }),
            },
          ]}
        />
      </article>
    </ExplainedShell>
  );
}

export function generateMetadata(): Metadata {
  return getAppMetadata(
    {
      title: t(DEFAULT_LOCALE, "explained.tdh.impl.meta.title"),
      description: t(DEFAULT_LOCALE, "explained.tdh.impl.meta.description"),
    },
    { canonicalPath: "/network/tdh/implementations" }
  );
}
