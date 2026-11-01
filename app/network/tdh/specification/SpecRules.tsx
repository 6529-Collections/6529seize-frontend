import type { ReactNode } from "react";
import Hash from "@/components/explained/marks/Hash";
import { formatInteger, formatList } from "@/i18n/format";
import { EX_FOCUS, EX_TEXT } from "@/components/explained/tokens";
import {
  CodeBlock,
  CodeName,
  EdSection,
  Prose,
  StackTable,
  Trap,
} from "@/components/explained/reference/parts";
import { FactText } from "@/components/explained/facts/FactText";
import type { HalfCent } from "@/lib/explained/registry/referenceFacts";
import {
  ARITHMETIC,
  DAILY_RATE,
  NETTING,
  ORDER,
  PAIR_STATE,
  RANGE,
  REPLAY,
  TOKEN_VALUES,
  TOPICS,
  UNDERFLOW,
  VALUES,
  boost,
  clusters,
  conventions,
  cutoff,
  editions,
  rates,
} from "./specCode";
import type { SpecContext } from "./specShared";
import { ENGINE } from "@/lib/explained/engine";

/**
 * The specification's rule sections, §1 to §8 (TDH-DESIGN.md §4.7, S1):
 * each restated in prose at reading size, with the rule's own formulas and
 * pseudocode beside it, every registry number read from the registry.
 */

/** A subsection: "§5.2 A Meme's effective edition", with its old anchor. */
function Sub({
  id,
  no,
  title,
  children,
}: {
  readonly id: string;
  readonly no: string;
  readonly title: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <div id={id} className="tw-mt-10 tw-scroll-mt-24 first:tw-mt-0">
      <h3 className={`${EX_TEXT.h3} tw-mb-2.5`}>
        <span className="tw-mr-2 tw-text-iron-400">{`§${no}`}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}

/** A quiet disclosure for a reference block a reader rarely needs. */
function More({
  summary,
  children,
}: {
  readonly summary: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <details className="tw-group tw-mt-4 tw-border-0 tw-border-t tw-border-solid tw-border-iron-900">
      <summary
        className={`tw-flex tw-min-h-11 tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-4 tw-py-3 tw-text-[15px] tw-font-semibold tw-text-iron-50 [&::-webkit-details-marker]:tw-hidden ${EX_FOCUS}`}
      >
        {summary}
        <span
          aria-hidden="true"
          className="tw-text-iron-400 group-open:tw-hidden"
        >
          +
        </span>
        <span
          aria-hidden="true"
          className="tw-hidden tw-text-iron-400 group-open:tw-inline"
        >
          –
        </span>
      </summary>
      <div className="tw-hidden tw-pb-4 group-open:tw-block">{children}</div>
    </details>
  );
}

function Section1({ ctx }: { readonly ctx: SpecContext }) {
  const { m, s, registry } = ctx;
  return (
    <EdSection
      id="s1"
      no="1"
      label={m("explained.tdh.spec.s1.label")}
      title={m("explained.tdh.spec.s1.heading")}
    >
      <Prose>{m("explained.tdh.spec.s1.body")}</Prose>
      {registry && (
        <CodeBlock
          className="tw-mt-5"
          code={conventions(registry)}
          label={s("explained.tdh.spec.s1.code")}
        />
      )}
    </EdSection>
  );
}

function Section2({ ctx }: { readonly ctx: SpecContext }) {
  const { m, s, book, locale } = ctx;
  const address = (id: Parameters<typeof book.maybe>[0], name: string) => {
    const fact = book.maybe<string>(id);
    return fact ? (
      <span data-fact={id}>
        <Hash
          value={fact.value}
          locale={locale}
          short={[2, 2]}
          copy
          name={name}
        />
      </span>
    ) : (
      "–"
    );
  };
  const code = (name: string) => <CodeName>{name}</CodeName>;
  const row = (
    key: string,
    role: string,
    fact: Parameters<typeof book.maybe>[0],
    standard: string,
    events: ReactNode
  ) => ({
    key,
    cells: {
      role,
      address: address(fact, role),
      standard,
      events,
    },
  });
  return (
    <EdSection
      id="s2"
      no="2"
      label={m("explained.tdh.spec.s2.label")}
      title={m("explained.tdh.spec.s2.heading")}
    >
      <Prose>{m("explained.tdh.spec.s2.body")}</Prose>
      <div className="tw-mt-5">
        <StackTable
          size="small"
          from="lg"
          caption={s("explained.tdh.spec.s2.table")}
          columns={[
            { key: "role", label: s("explained.tdh.spec.s2.col.role") },
            { key: "address", label: s("explained.tdh.spec.s2.col.address") },
            { key: "standard", label: s("explained.tdh.spec.s2.col.standard") },
            { key: "events", label: s("explained.tdh.spec.s2.col.events") },
          ]}
          rows={[
            row(
              "memes",
              s("explained.tdh.spec.s2.memes"),
              "rules.contract.memes",
              "ERC-1155",
              <>
                {code("TransferSingle")}, {code("TransferBatch")}
              </>
            ),
            row(
              "gradients",
              s("explained.tdh.spec.s2.gradients"),
              "rules.contract.gradients",
              "ERC-721",
              m("explained.tdh.spec.s2.transfer4", { event: code("Transfer") })
            ),
            row(
              "nextgen",
              s("explained.tdh.spec.s2.nextgen"),
              "rules.contract.nextgen",
              "ERC-721",
              m("explained.tdh.spec.s2.transfer4", { event: code("Transfer") })
            ),
            row(
              "delegation",
              s("explained.tdh.spec.s2.delegation"),
              "rules.contract.delegation",
              "–",
              m("explained.tdh.spec.s2.delegationEvents")
            ),
            row(
              "claim",
              s("explained.tdh.spec.s2.claim"),
              "rules.contract.claim",
              "–",
              m("explained.tdh.spec.s2.claimRead", {
                call: code("getClaimForToken"),
              })
            ),
          ]}
        />
      </div>
      <More summary={m("explained.tdh.spec.s2.topics")}>
        <CodeBlock
          code={TOPICS}
          label={s("explained.tdh.spec.s2.topicsCode")}
        />
      </More>
    </EdSection>
  );
}

function Section3({ ctx }: { readonly ctx: SpecContext }) {
  const { m, s } = ctx;
  return (
    <EdSection
      id="s3"
      no="3"
      label={m("explained.tdh.spec.s3.label")}
      title={m("explained.tdh.spec.s3.heading")}
    >
      <Sub id="s3-1" no="3.1" title={m("explained.tdh.spec.s3-1.title")}>
        <Prose>{m("explained.tdh.spec.s3-1.body")}</Prose>
      </Sub>
      <Sub id="s3-2" no="3.2" title={m("explained.tdh.spec.s3-2.title")}>
        <Prose>{m("explained.tdh.spec.s3-2.body")}</Prose>
      </Sub>
      <Sub id="s3-3" no="3.3" title={m("explained.tdh.spec.s3-3.title")}>
        <Prose>{m("explained.tdh.spec.s3-3.body")}</Prose>
        <CodeBlock
          className="tw-mt-4"
          code={ORDER}
          label={s("explained.tdh.spec.s3-3.code")}
        />
      </Sub>
      <Sub id="s3-4" no="3.4" title={m("explained.tdh.spec.s3-4.title")}>
        <Prose>
          {m("explained.tdh.spec.s3-4.body", {
            dead: <CodeName>0x…dead</CodeName>,
          })}
        </Prose>
      </Sub>
      <Sub id="s3-5" no="3.5" title={m("explained.tdh.spec.s3-5.title")}>
        <Prose>{m("explained.tdh.spec.s3-5.body")}</Prose>
        <CodeBlock
          className="tw-mt-4"
          code={VALUES}
          label={s("explained.tdh.spec.s3-5.code")}
        />
      </Sub>
    </EdSection>
  );
}

function Section4({ ctx }: { readonly ctx: SpecContext }) {
  const { m, s, registry } = ctx;
  return (
    <EdSection
      id="s4"
      no="4"
      label={m("explained.tdh.spec.s4.label")}
      title={m("explained.tdh.spec.s4.heading")}
    >
      <span id="s4-1" className="tw-scroll-mt-24" />
      <Prose>{m("explained.tdh.spec.s4.body")}</Prose>
      <span id="s4-2" className="tw-scroll-mt-24" />
      {registry && (
        <CodeBlock
          className="tw-mt-4"
          code={cutoff(registry)}
          label={s("explained.tdh.spec.s4.code")}
        />
      )}
      <span id="s4-3" className="tw-scroll-mt-24" />
      <Prose className="tw-mt-4">{m("explained.tdh.spec.s4.binds")}</Prose>
    </EdSection>
  );
}

function Section5({ ctx }: { readonly ctx: SpecContext }) {
  const { m, s, p, registry } = ctx;
  return (
    <EdSection
      id="s5"
      no="5"
      label={m("explained.tdh.spec.s5.label")}
      title={m("explained.tdh.spec.s5.title")}
    >
      <Sub id="s5-1" no="5.1" title={m("explained.tdh.spec.s5-1.title")}>
        <Prose>
          {m("explained.tdh.spec.s5-1.body", {
            age: p.v("rules.eligibilityAge"),
          })}
        </Prose>
      </Sub>
      <Sub id="s5-2" no="5.2" title={m("explained.tdh.spec.s5-2.title")}>
        {registry && (
          <CodeBlock
            code={editions(registry)}
            label={s("explained.tdh.spec.s5-2.code")}
          />
        )}
        <Prose className="tw-mt-5">
          {m("explained.tdh.spec.s5-2.body", {
            threshold: p.v("rules.editionThreshold"),
            cap: p.v("rules.editionFloorCap"),
            totalMax: <CodeName>totalMax</CodeName>,
          })}
        </Prose>
        <Trap
          className="tw-mt-4"
          label={m("explained.tdh.spec.s5-2.trapLabel", {
            adj: p.v("rules.firstgmAdjustment"),
          })}
        >
          {m("explained.tdh.spec.s5-2.trap", {
            minted: p.v("firstgm.minted"),
            edition: p.v("meme.8.edition"),
            h: p.v("engine.H"),
            burnTx: <CodeName>firstgm_burn_tx</CodeName>,
          })}
        </Trap>
      </Sub>
      <Sub id="s5-3" no="5.3" title={m("explained.tdh.spec.s5-3.title")}>
        {registry && (
          <CodeBlock
            code={rates(registry)}
            label={s("explained.tdh.spec.s5-3.code")}
          />
        )}
        <Prose className="tw-mt-4">{m("explained.tdh.spec.s5-3.body")}</Prose>
      </Sub>
      <Sub id="s5-4" no="5.4" title={m("explained.tdh.spec.s5-4.title")}>
        <Prose>
          {m("explained.tdh.spec.s5-4.body", {
            bonus: p.v("rules.seasonBonus"),
            last: p.v("rules.lastBoostedSeason"),
          })}
        </Prose>
      </Sub>
    </EdSection>
  );
}

function Section6({ ctx }: { readonly ctx: SpecContext }) {
  const { m, s, p, registry } = ctx;
  return (
    <EdSection
      id="s6"
      no="6"
      label={m("explained.tdh.spec.s6.label")}
      title={m("explained.tdh.spec.s6.heading", {
        max: p.v("rules.maxWallets"),
      })}
    >
      <Sub id="s6-1" no="6.1" title={m("explained.tdh.spec.s6-1.title")}>
        <Prose>{m("explained.tdh.spec.s6-1.body")}</Prose>
      </Sub>
      <Sub id="s6-2" no="6.2" title={m("explained.tdh.spec.s6-2.title")}>
        <Prose>{m("explained.tdh.spec.s6-2.body")}</Prose>
        <CodeBlock
          className="tw-mt-4"
          code={PAIR_STATE}
          label={s("explained.tdh.spec.s6-2.code")}
        />
      </Sub>
      <Sub id="s6-3" no="6.3" title={m("explained.tdh.spec.s6-3.title")}>
        <Prose>
          {m("explained.tdh.spec.s6-3.body", {
            ungated: p.v("rules.ungatedMaxWallets"),
            max: p.v("rules.maxWallets"),
            gate: p.v("rules.gateActivation", "long"),
          })}
        </Prose>
        {registry && (
          <CodeBlock
            className="tw-mt-4"
            code={clusters(registry)}
            label={s("explained.tdh.spec.s6-3.code")}
          />
        )}
      </Sub>
      <Sub id="s6-4" no="6.4" title={m("explained.tdh.spec.s6-4.title")}>
        <span id="s6-5" className="tw-scroll-mt-24" />
        <Prose>{m("explained.tdh.spec.s6-4.body")}</Prose>
      </Sub>
    </EdSection>
  );
}

function Section7({ ctx }: { readonly ctx: SpecContext }) {
  const { m, s } = ctx;
  return (
    <EdSection
      id="s7"
      no="7"
      label={m("explained.tdh.spec.s7.label")}
      title={m("explained.tdh.spec.s7.heading")}
    >
      <Sub id="s7-1" no="7.1" title={m("explained.tdh.spec.s7-1.title")}>
        <Prose>{m("explained.tdh.spec.s7-1.body")}</Prose>
        <CodeBlock
          className="tw-mt-4"
          code={UNDERFLOW}
          label={s("explained.tdh.spec.s7-1.underflow")}
          showLabel
        />
        <CodeBlock
          className="tw-mt-3"
          code={NETTING}
          label={s("explained.tdh.spec.s7-1.netting")}
          showLabel
        />
        <CodeBlock
          className="tw-mt-3"
          code={REPLAY}
          label={s("explained.tdh.spec.s7-1.replay")}
          showLabel
        />
        <Prose className="tw-mt-4">
          {m("explained.tdh.spec.s7-1.replayNote")}
        </Prose>
        <Prose>{m("explained.tdh.spec.s7-1.property")}</Prose>
      </Sub>
      <Sub id="s7-2" no="7.2" title={m("explained.tdh.spec.s7-2.title")}>
        <Prose>{m("explained.tdh.spec.s7-2.body")}</Prose>
        <CodeBlock
          className="tw-mt-4"
          code={TOKEN_VALUES}
          label={s("explained.tdh.spec.s7-2.title")}
        />
      </Sub>
      <Sub id="s7-3" no="7.3" title={m("explained.tdh.spec.s7-3.title")}>
        <Prose>{m("explained.tdh.spec.s7-3.body")}</Prose>
      </Sub>
    </EdSection>
  );
}

/**
 * §8.3's checkpoints for ADD, the extra-set bonus, from the engine: two
 * sets, three, and where it stops growing.
 */
function addCheckpoints(locale: SpecContext["locale"]): string {
  const add = (sets: number) => ENGINE.additionalSetsMicro(sets);
  let saturated = 2;
  const ceiling = add(SATURATION_PROBE);
  while (saturated < SATURATION_PROBE && add(saturated) !== ceiling) {
    saturated += 1;
  }
  const n = (value: number) => formatInteger(locale, value);
  return [
    `ADD(2) = ${n(add(2))}`,
    `ADD(3) = ${n(add(3))}`,
    `ADD(s) = ${n(ceiling)} for every s >= ${saturated}   # micro-units`,
  ].join("\n");
}

/** Where ADD is surely saturated: far past the first set it stops at. */
const SATURATION_PROBE = 200;

/**
 * §8.4's tie: base × beta / 100 is exactly a half in decimals, but B64(β /
 * 100) lies just below it, so FINAL rounds down (P26 §8.1's binary64).
 */
const FINAL_TIE = { base: 25, beta: 114 } as const;

function finalTie(): string {
  return String(ENGINE.finalTdh(FINAL_TIE.base, FINAL_TIE.beta));
}

function Section8({ ctx }: { readonly ctx: SpecContext }) {
  const { m, s, p, book, locale, registry } = ctx;
  const trap = book.maybe<HalfCent>("engine.halfCent");
  const cents = (value: number) => (
    <FactText fact={trap} locale={locale}>
      {formatInteger(locale, value)}
    </FactText>
  );
  return (
    <EdSection
      id="s8"
      no="8"
      label={m("explained.tdh.spec.s8.label")}
      title={m("explained.tdh.spec.s8.title")}
    >
      <Sub id="s8-1" no="8.1" title={m("explained.tdh.spec.s8-1.title")}>
        <CodeBlock
          code={ARITHMETIC}
          label={s("explained.tdh.spec.s8-1.code")}
        />
        {trap && (
          <Trap
            className="tw-mt-5"
            label={m("explained.tdh.spec.s8-1.trapLabel")}
          >
            {m("explained.tdh.spec.s8-1.trap", {
              halfUpRule: <CodeName>HALFUP(100n / d)</CodeName>,
              oddRule: <CodeName>200n / d</CodeName>,
              h: p.v("engine.H"),
              editions: (
                <FactText fact={trap} locale={locale}>
                  {formatList(
                    locale,
                    trap.value.editions.map((edition) =>
                      formatInteger(locale, edition)
                    )
                  )}
                </FactText>
              ),
              // A call is code: its numbers print as the rule writes them,
              // with no thousands separator (RATE(3941, 200), not 3,941).
              call: (
                <FactText fact={trap} locale={locale}>
                  <CodeName>{`RATE(${trap.value.h}, ${trap.value.example})`}</CodeName>
                </FactText>
              ),
              rate: <b className="tw-text-iron-50">{cents(trap.value.rate)}</b>,
              halfUp: cents(trap.value.halfUp),
            })}
          </Trap>
        )}
      </Sub>
      <Sub id="s8-2" no="8.2" title={m("explained.tdh.spec.s8-2.title")}>
        <Prose>{m("explained.tdh.spec.s8-2.body")}</Prose>
      </Sub>
      <Sub id="s8-3" no="8.3" title={m("explained.tdh.spec.s8-3.title")}>
        <Prose>{m("explained.tdh.spec.s8-3.body")}</Prose>
        {registry && (
          <CodeBlock
            className="tw-mt-4"
            code={boost(registry)}
            label={s("explained.tdh.spec.s8-3.code")}
          />
        )}
        <CodeBlock
          className="tw-mt-3"
          code={addCheckpoints(locale)}
          label={s("explained.tdh.spec.s8-3.checkpoints")}
        />
      </Sub>
      <Sub id="s8-4" no="8.4" title={m("explained.tdh.spec.s8-4.title")}>
        <Prose>{m("explained.tdh.spec.s8-4.body")}</Prose>
        <Trap
          className="tw-mt-5"
          label={m("explained.tdh.spec.s8-4.trapLabel")}
        >
          {m("explained.tdh.spec.s8-4.trap", {
            call: (
              <CodeName>{`FINAL(${FINAL_TIE.base}, ${FINAL_TIE.beta})`}</CodeName>
            ),
            final: <CodeName>{finalTie()}</CodeName>,
            decimal: (
              <CodeName>
                {String(
                  Math.floor((FINAL_TIE.base * FINAL_TIE.beta + 50) / 100)
                )}
              </CodeName>
            ),
          })}
        </Trap>
      </Sub>
      <Sub id="s8-5" no="8.5" title={m("explained.tdh.spec.s8-5.title")}>
        <Prose>{m("explained.tdh.spec.s8-5.body")}</Prose>
      </Sub>
      <Sub id="s8-6" no="8.6" title={m("explained.tdh.spec.s8-6.title")}>
        <Prose>{m("explained.tdh.spec.s8-6.body")}</Prose>
        <CodeBlock
          className="tw-mt-4"
          code={DAILY_RATE}
          label={s("explained.tdh.spec.s8-6.title")}
        />
      </Sub>
      <Sub id="s8-7" no="8.7" title={m("explained.tdh.spec.s8-7.title")}>
        <Prose>{m("explained.tdh.spec.s8-7.body")}</Prose>
        <CodeBlock
          className="tw-mt-4"
          code={RANGE}
          label={s("explained.tdh.spec.s8-7.title")}
        />
      </Sub>
    </EdSection>
  );
}

export default function SpecRules({ ctx }: { readonly ctx: SpecContext }) {
  return (
    <>
      <Section1 ctx={ctx} />
      <Section2 ctx={ctx} />
      <Section3 ctx={ctx} />
      <Section4 ctx={ctx} />
      <Section5 ctx={ctx} />
      <Section6 ctx={ctx} />
      <Section7 ctx={ctx} />
      <Section8 ctx={ctx} />
    </>
  );
}
