import Hash from "@/components/explained/marks/Hash";
import DriftNote from "@/components/explained/marks/DriftNote";
import { Scoreboard } from "@/components/explained/evidence/claims";
import { EX_LINK } from "@/components/explained/tokens";
import {
  CodeName,
  EyebrowNumber,
  PageHead,
  Trap,
} from "@/components/explained/reference/parts";
import type { SureContext } from "./sureShared";

/**
 * How sure's head (TDH-DESIGN.md §4.6 §0): the title and lede, the drift
 * note while the served manifest is about the rules before D136 and D137,
 * the scoreboard once, and the manifest's own record under it.
 */
export default function SureHead({
  ctx,
  chapter,
  n,
}: {
  readonly ctx: SureContext;
  /** "01": the chapter's number, from the map. */
  readonly chapter: string;
  /** "4": the page's place in the chapter. */
  readonly n: string;
}) {
  const { m, p, book, locale } = ctx;
  const sha = book.maybe<string>("manifest.sha256");
  return (
    <>
      <PageHead
        id="why"
        eyebrow={m("explained.tdh.sure.eyebrow", {
          chapter: <span>{chapter}</span>,
          n: <EyebrowNumber>{n}</EyebrowNumber>,
        })}
        title={m("explained.tdh.sure.title")}
        lede={m("explained.tdh.sure.lede")}
      />
      {ctx.olderRules && (
        <div className="tw-mt-8">
          <DriftNote by={["D136", "D137"]} locale={locale}>
            {m("explained.tdh.sure.drift", {
              oldName: <CodeName>{p.v("manifest.ruleVersion")}</CodeName>,
              written: p.v("manifest.writtenAt"),
            })}
          </DriftNote>
        </div>
      )}
      {ctx.leanMoved && (
        <Trap className="tw-mt-8" label={m("explained.tdh.sure.moved.label")}>
          {m("explained.tdh.sure.moved.body", {
            leanCommit: <CodeName>{p.v("rules.leanCommit")}</CodeName>,
            leanDay: p.v("rules.leanDate"),
            commit: <CodeName>{p.v("manifest.commit")}</CodeName>,
          })}
        </Trap>
      )}
      <div className="tw-mt-8">
        <Scoreboard
          label={ctx.s("explained.tdh.sure.score.label")}
          locale={locale}
          cells={[
            {
              value: book.maybe("manifest.sections.count"),
              caption: m("explained.tdh.sure.score.claims", {
                link: (
                  <a className={EX_LINK} href="#claims">
                    {m("explained.tdh.sure.score.claimsLink")}
                  </a>
                ),
              }),
            },
            {
              value: book.maybe("manifest.proved"),
              // "each a distinct statement" once no theorem is listed twice.
              caption:
                book.maybe<number>("manifest.distinct")?.value ===
                book.maybe<number>("manifest.proved")?.value
                  ? m("explained.tdh.sure.score.provedAll", {
                      examples: p.v("manifest.noAxioms"),
                    })
                  : m("explained.tdh.sure.score.proved", {
                      distinct: p.v("manifest.distinct"),
                      examples: p.v("manifest.noAxioms"),
                    }),
            },
            {
              value: book.maybe("manifest.shownFalse"),
              caption: m("explained.tdh.sure.score.false", {
                kernel: p.v("manifest.shownFalse.kernel"),
                evaluation: p.v("manifest.shownFalse.evaluation"),
              }),
            },
            {
              value: book.maybe("manifest.limits"),
              caption: m("explained.tdh.sure.score.limits", {
                link: (
                  <a className={EX_LINK} href="#limits">
                    {m("explained.tdh.sure.score.limitsLink")}
                  </a>
                ),
              }),
            },
          ]}
        />
      </div>
      <ul
        className="tw-m-0 tw-mt-3.5 tw-flex tw-list-none tw-flex-wrap tw-items-center tw-gap-x-6 tw-gap-y-1 tw-p-0 tw-text-[13px] tw-font-medium tw-leading-5 tw-text-iron-400"
        aria-label={ctx.s("explained.tdh.sure.src.label")}
      >
        <li>
          {m("explained.tdh.sure.src.lean", {
            version: p.v("manifest.lean"),
          })}
        </li>
        <li className="tw-inline-flex tw-flex-wrap tw-items-center tw-gap-1">
          {sha
            ? m("explained.tdh.sure.src.file", {
                sha: (
                  <span data-fact="manifest.sha256">
                    <Hash value={sha.value} locale={locale} />
                  </span>
                ),
              })
            : m("explained.tdh.sure.src.bundled")}
        </li>
        <li>
          {m("explained.tdh.sure.src.audited", {
            audited: p.v("manifest.audited"),
            proved: p.v("manifest.proved"),
            kernel: p.v("manifest.shownFalse.kernel"),
            tdh: p.v("manifest.audited.tdh"),
            p53: p.v("manifest.audited.p53"),
          })}
        </li>
        <li>
          {m("explained.tdh.sure.src.vectors", {
            passed: p.v("manifest.vectors.passed"),
            total: p.v("manifest.vectors.total"),
          })}
        </li>
      </ul>
    </>
  );
}
