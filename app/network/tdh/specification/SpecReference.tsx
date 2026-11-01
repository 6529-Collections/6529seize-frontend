import Link from "next/link";
import type { ReactNode } from "react";
import { EX_LINK } from "@/components/explained/tokens";
import {
  Caption,
  CodeName,
  EdSection,
  Prose,
  StackTable,
} from "@/components/explained/reference/parts";
import { FactScope } from "@/components/explained/facts/FactText";
import { isMessageKey } from "@/components/explained/rich";
import type { SpecContext, SpecKey } from "./specShared";

/**
 * The specification's reference sections, §9 to §13 (TDH-DESIGN.md §4.7,
 * S1): the output and its roots as the target, the registry, P26's
 * deviations and legacy issues by ID, and conformance with the real day it
 * was checked against.
 */

const KEPT = "explained.tdh.spec.s11.kept";

/** How P26 §11 decided each deviation (D121, D131, D136). */
const DECISION: Readonly<Record<string, SpecKey>> = {
  "DEV-2": "explained.tdh.spec.s11.specWins",
  "DEV-10": KEPT,
  "DEV-12": KEPT,
  "DEV-14": KEPT,
  "DEV-17": KEPT,
  "DEV-13": "explained.tdh.spec.s11.sinks",
  // Found after D121 by program B's review (D136's paragraph of P26 §11):
  // P26 recommends them, and no decision adopts them yet.
  "DEV-20": "explained.tdh.spec.s11.proposedSpecWins",
  "DEV-21": "explained.tdh.spec.s11.proposedAdopt",
  "DEV-22": "explained.tdh.spec.s11.proposedAdopt",
};

function itemKey(
  kind: "dev" | "bug",
  id: string,
  part: "old" | "v14" | "effect" | "issue"
): SpecKey | null {
  const key = `explained.tdh.spec.${kind}.${id}.${part}`;
  return isMessageKey(key) ? (key as SpecKey) : null;
}

function Section9({ ctx }: { readonly ctx: SpecContext }) {
  const { m, p } = ctx;
  const cycle = p.num("tdh.latest.cycle");
  return (
    <EdSection
      id="s9"
      no="9"
      label={m("explained.tdh.spec.s9.label")}
      title={m("explained.tdh.spec.s9.heading")}
    >
      <Prose>{m("explained.tdh.spec.s9.body")}</Prose>
      <Caption>
        {m("explained.tdh.spec.s9.receipt", {
          link: (
            <Link
              className={EX_LINK}
              href={`/network/tdh/verification/${cycle ?? ""}`}
            >
              {m("explained.tdh.spec.s9.receiptLink", {
                date: p.v("tdh.latest.date"),
              })}
            </Link>
          ),
        })}
      </Caption>
    </EdSection>
  );
}

function Section10({ ctx }: { readonly ctx: SpecContext }) {
  const { m, s, p } = ctx;
  const field = (...names: string[]): ReactNode => (
    <span className="tw-font-normal">
      {names.map((name, index) => (
        <span key={name}>
          {index > 0 && ", "}
          <CodeName wrap>{name}</CodeName>
        </span>
      ))}
    </span>
  );
  const pair = (a: ReactNode, b: ReactNode) => (
    <>
      {a}, {b}
    </>
  );
  return (
    <EdSection
      id="s10"
      no="10"
      label={m("explained.tdh.spec.s10.label")}
      title={m("explained.tdh.spec.s10.heading")}
    >
      <div className="tw-mt-2">
        <StackTable
          caption={s("explained.tdh.spec.s10.table")}
          columns={[
            { key: "field", label: s("explained.tdh.spec.s10.col.field") },
            { key: "value", label: s("explained.tdh.spec.s10.col.value") },
            { key: "used", label: s("explained.tdh.spec.s10.col.used") },
          ]}
          rows={[
            {
              key: "age",
              cells: {
                field: field("eligibility_min_age_s"),
                value: p.v("rules.eligibilityAge"),
                used: m("explained.tdh.spec.s10.used.age"),
              },
            },
            {
              key: "floor",
              cells: {
                field: field("edition_floor_threshold", "edition_floor_cap"),
                value: pair(
                  p.v("rules.editionThreshold"),
                  p.v("rules.editionFloorCap")
                ),
                used: m("explained.tdh.spec.s10.used.floor"),
              },
            },
            {
              key: "firstgm",
              cells: {
                field: field("firstgm_edition_adjustment"),
                value: p.v("rules.firstgmAdjustment"),
                used: m("explained.tdh.spec.s10.used.firstgm"),
              },
            },
            {
              key: "season",
              cells: {
                field: field("season_bonus", "last_boosted_season"),
                value: pair(
                  p.v("rules.seasonBonus"),
                  p.v("rules.lastBoostedSeason")
                ),
                used: m("explained.tdh.spec.s10.used.season"),
              },
            },
            {
              key: "sets",
              cells: {
                field: field("additional_set_first", "additional_set_ratio"),
                value: pair(
                  p.v("rules.additionalSetFirst"),
                  p.v("rules.additionalSetRatio")
                ),
                used: m("explained.tdh.spec.s10.used.sets"),
              },
            },
            {
              key: "gradient",
              cells: {
                field: field("gradient_bonus", "gradient_max_count"),
                value: pair(
                  p.v("rules.gradientBonus"),
                  p.v("rules.gradientMax")
                ),
                used: m("explained.tdh.spec.s10.used.gradient"),
              },
            },
            {
              key: "max",
              cells: {
                field: field("consolidation_max_wallets"),
                value: p.v("rules.maxWallets"),
                used: m("explained.tdh.spec.s10.used.max"),
              },
            },
            {
              key: "ungated",
              cells: {
                field: field("consolidation_ungated_max_wallets"),
                value: p.v("rules.ungatedMaxWallets"),
                used: m("explained.tdh.spec.s10.used.ungated"),
              },
            },
            {
              key: "gate",
              cells: {
                field: field("consolidation_gate_activation_s"),
                value: p.v("rules.gateActivationSeconds"),
                used: m("explained.tdh.spec.s10.used.gate", {
                  gate: p.v("rules.gateActivation"),
                }),
              },
            },
          ]}
        />
      </div>
      <Caption className="tw-mt-3">
        {m("explained.tdh.spec.s10.note", {
          registry: <CodeName wrap>{p.v("rules.registry")}</CodeName>,
          vector: <CodeName>28-registry-hash</CodeName>,
        })}
      </Caption>
    </EdSection>
  );
}

function Section11({ ctx }: { readonly ctx: SpecContext }) {
  const { m, s, p } = ctx;
  const settled = ctx.deviations.filter((item) => item.settled);
  const decision = (id: string, isSettled: boolean): ReactNode => {
    if (isSettled) return m("explained.tdh.spec.s11.settled");
    return m(DECISION[id] ?? "explained.tdh.spec.s11.adopted");
  };
  const text = (id: string, part: "old" | "v14" | "effect") => {
    const key = itemKey("dev", id, part);
    return key ? m(key) : "–";
  };
  return (
    <EdSection
      id="s11"
      no="11"
      label={m("explained.tdh.spec.s11.label")}
      title={m("explained.tdh.spec.s11.heading", {
        count: p.v("spec.deviations.inForce"),
      })}
      full={
        <FactScope className="tw-mt-6" ids={["spec.deviations"]}>
          <StackTable
            size="small"
            from="lg"
            caption={s("explained.tdh.spec.s11.table")}
            columns={[
              { key: "id", label: s("explained.tdh.spec.s11.col.id") },
              { key: "old", label: s("explained.tdh.spec.s11.col.old") },
              { key: "v14", label: s("explained.tdh.spec.s11.col.v14") },
              { key: "effect", label: s("explained.tdh.spec.s11.col.effect") },
              {
                key: "decision",
                label: s("explained.tdh.spec.s11.col.decision"),
              },
            ]}
            rows={ctx.deviations.map((item) => ({
              key: item.id,
              id: item.id.toLowerCase(),
              cells: {
                id: <CodeName>{item.id}</CodeName>,
                old: text(item.id, "old"),
                v14: text(item.id, "v14"),
                effect: text(item.id, "effect"),
                decision: decision(item.id, item.settled),
              },
            }))}
          />
        </FactScope>
      }
    >
      <Prose>
        {m("explained.tdh.spec.s11.body", {
          day: p.v("model.replayDay", "long"),
          settled: (
            <span data-fact="spec.deviations">
              {settled.map((item, index) => (
                <span key={item.id}>
                  {index > 0 && ", "}
                  <CodeName>{item.id}</CodeName>
                </span>
              ))}
            </span>
          ),
        })}
      </Prose>
    </EdSection>
  );
}

function Section12({ ctx }: { readonly ctx: SpecContext }) {
  const { m, s, p } = ctx;
  const text = (id: string, part: "issue" | "v14") => {
    const key = itemKey("bug", id, part);
    return key ? m(key) : "–";
  };
  return (
    <EdSection
      id="s12"
      no="12"
      label={m("explained.tdh.spec.s12.label")}
      title={m("explained.tdh.spec.s12.heading", {
        count: p.v("spec.issues"),
      })}
    >
      <Prose>{m("explained.tdh.spec.s12.body")}</Prose>
      <FactScope className="tw-mt-5" ids={["spec.issueIds"]}>
        <StackTable
          size="small"
          caption={s("explained.tdh.spec.s12.table")}
          columns={[
            { key: "id", label: s("explained.tdh.spec.s12.col.id") },
            { key: "issue", label: s("explained.tdh.spec.s12.col.issue") },
            { key: "v14", label: s("explained.tdh.spec.s12.col.v14") },
          ]}
          rows={ctx.issues.map((id) => ({
            key: id,
            id: id.toLowerCase(),
            cells: {
              id: <CodeName>{id}</CodeName>,
              issue: text(id, "issue"),
              v14: text(id, "v14"),
            },
          }))}
        />
      </FactScope>
    </EdSection>
  );
}

function Section13({ ctx }: { readonly ctx: SpecContext }) {
  const { m, p } = ctx;
  return (
    <EdSection
      id="s13"
      no="13"
      label={m("explained.tdh.spec.s13.label")}
      title={m("explained.tdh.spec.s13.heading")}
    >
      <Prose>
        {m("explained.tdh.spec.s13.body", {
          count: p.v("vectors.public.count"),
          link: (
            <Link className={EX_LINK} href="/network/tdh/implementations">
              {m("explained.tdh.spec.s13.link")}
            </Link>
          ),
        })}
      </Prose>
      <Prose>{m("explained.tdh.spec.s13.invalid")}</Prose>
      <div id="evidence" className="tw-mt-8 tw-scroll-mt-24">
        <h3 className="tw-m-0 tw-mb-2.5 tw-text-[21px] tw-font-semibold tw-leading-7 tw-text-iron-50">
          {m("explained.tdh.spec.evidence.title")}
        </h3>
        <p
          id="evidence-replay"
          className="tw-m-0 tw-max-w-[660px] tw-scroll-mt-24"
        >
          {m("explained.tdh.spec.evidence.body", {
            day: p.v("model.replayDay", "long"),
            total: p.v("replay.total"),
            withoutBurn: p.v("replay.withoutSinks"),
          })}
        </p>
      </div>
    </EdSection>
  );
}

export default function SpecReference({ ctx }: { readonly ctx: SpecContext }) {
  return (
    <>
      <Section9 ctx={ctx} />
      <Section10 ctx={ctx} />
      <Section11 ctx={ctx} />
      <Section12 ctx={ctx} />
      <Section13 ctx={ctx} />
    </>
  );
}
