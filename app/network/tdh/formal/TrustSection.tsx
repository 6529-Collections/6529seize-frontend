import { formatList } from "@/i18n/format";
import {
  AssumptionLedger,
  type LedgerRow,
} from "@/components/explained/evidence/claims";
import { EX_LAYOUT, EX_TEXT } from "@/components/explained/tokens";
import { CodeName, EdSection } from "@/components/explained/reference/parts";
import { isMessageKey } from "@/components/explained/rich";
import { caseLetter, type SureContext, type SureKey } from "./sureShared";

/**
 * §04 What you still have to trust (TDH-DESIGN.md §4.6): the ledger of
 * assumptions with their marks, then the limits the manifest names, each
 * in a sentence, in the manifest's order.
 */
function limitKey(id: string): SureKey | null {
  const key = `explained.tdh.sure.limit.${id}`;
  return isMessageKey(key) ? (key as SureKey) : null;
}

export default function TrustSection({ ctx }: { readonly ctx: SureContext }) {
  const { m, s, p, locale } = ctx;
  const evaluated = ctx.sections
    .flatMap((section) => section.entries)
    .filter(
      (entry) =>
        entry.status === "counterexample" && entry.checkedBy === "evaluation"
    )
    .map((entry) => caseLetter(entry.id))
    .filter((letter): letter is string => letter !== null)
    .sort((a, b) => a.localeCompare(b));
  const rows: LedgerRow[] = [
    {
      assumption: s("explained.tdh.sure.ledger.kernel"),
      mark: "assumed",
      covers: m("explained.tdh.sure.ledger.kernelCovers"),
    },
    {
      assumption: s("explained.tdh.sure.ledger.compiler"),
      mark: "assumed",
      covers: m("explained.tdh.sure.ledger.compilerCovers", {
        cases: formatList(locale, evaluated),
      }),
    },
    {
      assumption: s("explained.tdh.sure.ledger.model"),
      mark: "tested",
      covers: m("explained.tdh.sure.ledger.modelCovers", {
        day: p.v("model.replayDay"),
        random: p.v("model.randomInputs"),
        perChange: p.v("programs.randomPerChange"),
      }),
    },
    {
      assumption: s("explained.tdh.sure.ledger.programs"),
      mark: "notProved",
      covers: m("explained.tdh.sure.ledger.programsCovers"),
    },
    {
      assumption: s("explained.tdh.sure.ledger.rerun"),
      mark: "notYet",
      covers: m("explained.tdh.sure.ledger.rerunCovers", {
        commit: <CodeName>{p.v("manifest.commit")}</CodeName>,
      }),
    },
  ];
  const limits = ctx.sections.flatMap((section) =>
    section.entries
      .filter((entry) => entry.status === "deferred")
      .map((entry) => {
        const key = limitKey(entry.id);
        return {
          id: entry.id,
          // A limit this page has no sentence for keeps the manifest's words.
          text: key ? m(key) : (entry.statement ?? entry.id),
        };
      })
  );
  return (
    <EdSection
      id="not"
      tight={false}
      no="06"
      label={m("explained.tdh.sure.not.label")}
      title={m("explained.tdh.sure.not.title")}
      full={
        <div
          id="limits"
          className={`${EX_LAYOUT.ed} tw-mt-12 tw-scroll-mt-24 md:tw-mt-16`}
        >
          <div className="lg:tw-pt-2.5">
            <span className={`${EX_TEXT.label} tw-block`}>
              {m("explained.tdh.sure.limits.label", {
                count: p.v("manifest.limits"),
              })}
            </span>
          </div>
          <div className={`${EX_LAYOUT.edWide} tw-min-w-0`}>
            <ol
              className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-x-8 tw-border-0 tw-border-t tw-border-solid tw-border-iron-700 tw-p-0 md:tw-grid-cols-2"
              aria-label={s("explained.tdh.sure.limits.list")}
            >
              {limits.map((limit, index) => (
                <li
                  key={limit.id}
                  className="tw-grid tw-grid-cols-[30px_minmax(0,1fr)] tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-3 tw-text-base tw-leading-6 tw-text-iron-300"
                >
                  <span className="tw-text-sm tw-font-semibold tw-text-iron-400">
                    {index + 1}
                  </span>
                  <span>{limit.text}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      }
    >
      <div className="tw-mt-6">
        <AssumptionLedger rows={rows} locale={locale} />
      </div>
    </EdSection>
  );
}
