import type { ReactNode } from "react";
import { formatList } from "@/i18n/format";
import {
  ClaimTable,
  type ClaimRow,
} from "@/components/explained/evidence/claims";
import type { FactEntry } from "@/lib/explained/facts";
import DriftNote from "@/components/explained/marks/DriftNote";
import { Caption, EdSection } from "@/components/explained/reference/parts";
import { FactScope } from "@/components/explained/facts/FactText";
import { isMessageKey } from "@/components/explained/rich";
import {
  caseLetter,
  countOf,
  type SureContext,
  type SureKey,
  type SureSection,
} from "./sureShared";

/**
 * §03 The claims (TDH-DESIGN.md §4.6): one row per section of the
 * manifest, in its order, each with its limit beside it and its counts from
 * the manifest; then the counterexamples by kind. A section this page has
 * no words for still gets its row, under the manifest's own title.
 */
function claimKey(
  id: string,
  part: "what" | "detail" | "limit"
): SureKey | null {
  const key = `explained.tdh.sure.claim.${id}.${part}`;
  return isMessageKey(key) ? (key as SureKey) : null;
}

function claimRow(ctx: SureContext, section: SureSection): ClaimRow {
  const { m, s, p, book } = ctx;
  const what = claimKey(section.id, "what");
  const detail = claimKey(section.id, "detail");
  const limit = claimKey(section.id, "limit");
  const base = book.maybe("manifest.sections");
  const counts = section.counts;
  const count = (n: number | undefined): FactEntry | null =>
    n === undefined ? null : countOf(base, n);
  const cap = p.f("validators.cap");
  return {
    what: what
      ? s(what, { cap })
      : (section.title ??
        s("explained.tdh.sure.check.untitled", { id: section.id })),
    detail: detail
      ? s(detail, { cap })
      : s("explained.tdh.sure.claim.other.detail"),
    limit: limit
      ? m(limit, {
          wallet: p.v("cases.F.wallet"),
          identity: p.v("cases.F.identity"),
        })
      : m("explained.tdh.sure.claim.other.limit"),
    counts: {
      proved: count(counts?.proved),
      shownFalse: count(counts?.shownFalse),
      limits: count(counts?.limits),
    },
  };
}

/** The counterexample letters of a group: "H and I". */
function letters(ctx: SureContext, pick: (section: string) => boolean): string {
  const found = ctx.sections
    .filter((section) => pick(section.id))
    .flatMap((section) =>
      section.entries
        .filter((entry) => entry.status === "counterexample")
        .map((entry) => caseLetter(entry.id))
    )
    .filter((letter): letter is string => letter !== null)
    .sort((a, b) => a.localeCompare(b));
  return formatList(ctx.locale, found);
}

export default function ClaimsSection({ ctx }: { readonly ctx: SureContext }) {
  const { m, p, locale } = ctx;
  const rows = ctx.sections.map((section) => claimRow(ctx, section));
  const byKind: ReactNode = m("explained.tdh.sure.claims.falseByKind", {
    count: p.v("manifest.shownFalse"),
    firstRule: p.v("manifest.shownFalse.firstRule"),
    day: p.v("netting.day"),
    netting: p.v("manifest.shownFalse.netting"),
    nettingCases: letters(ctx, (id) => id === "1"),
    never: p.v("manifest.shownFalse.never"),
    neverCases: letters(ctx, (id) => id !== "1"),
    p53: p.v("manifest.shownFalse.p53"),
  });
  return (
    <EdSection
      id="claims"
      tight={false}
      no="03"
      label={m("explained.tdh.sure.claims.label")}
      title={m("explained.tdh.sure.claims.title")}
      titleId="statements"
      full={
        <>
          <FactScope
            className="tw-mt-6"
            ids={["manifest.sections", "validators.cap"]}
          >
            <ClaimTable rows={rows} locale={locale} />
          </FactScope>
          <Caption className="tw-mt-4">{byKind}</Caption>
          {/* D148 exempts the network-held accounts from the cap claim 5a
              states for every party; the Lean model predates it. */}
          <div className="tw-mt-6">
            <DriftNote by={["D144", "D148", "D150"]} locale={locale}>
              {m("explained.tdh.sure.claims.capDrift", {
                cap: p.v("validators.cap"),
              })}
            </DriftNote>
          </div>
        </>
      }
    />
  );
}
