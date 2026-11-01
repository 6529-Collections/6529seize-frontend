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
          {m("explained.tdh.sure.src.vectors", {
            passed: p.v("manifest.vectors.passed"),
            total: p.v("manifest.vectors.total"),
          })}
        </li>
      </ul>
      <p className="tw-m-0 tw-mt-5 tw-max-w-[720px] tw-text-[15px] tw-leading-6 tw-text-iron-300">
        {m("explained.tdh.sure.score.terms")}
      </p>
      <SplitTable ctx={ctx} />
    </>
  );
}

/**
 * The counts by whose rules they are about: TDH's (P26) or the validators'
 * (P53, a proposal). One small table instead of four ways of slicing the
 * same numbers in a sentence.
 */
function SplitTable({ ctx }: { readonly ctx: SureContext }) {
  const { m, p } = ctx;
  const head =
    "tw-border-0 tw-border-b tw-border-solid tw-border-iron-700 tw-py-2 tw-pr-4 tw-text-left tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.1em] tw-text-iron-400 last:tw-pr-0";
  const cell =
    "tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-2.5 tw-pr-4 tw-text-[15px] tw-tabular-nums tw-text-iron-300 last:tw-pr-0";
  const rows = [
    {
      id: "tdh",
      name: m("explained.tdh.sure.split.tdh"),
      proved: p.v("manifest.proved.tdh"),
      shownFalse: p.v("manifest.shownFalse.tdh"),
      audited: p.v("manifest.audited.tdh"),
    },
    {
      id: "p53",
      name: m("explained.tdh.sure.split.p53"),
      proved: p.v("manifest.proved.p53"),
      shownFalse: p.v("manifest.shownFalse.p53"),
      audited: p.v("manifest.audited.p53"),
    },
    {
      id: "all",
      name: m("explained.tdh.sure.split.all"),
      proved: p.v("manifest.proved"),
      shownFalse: p.v("manifest.shownFalse"),
      audited: p.v("manifest.audited"),
    },
  ];
  return (
    <div className="tw-mt-5 tw-max-w-[720px] tw-overflow-x-auto">
      <table className="tw-w-full tw-border-collapse" data-split="">
        <caption className="tw-sr-only">
          {m("explained.tdh.sure.split.caption")}
        </caption>
        <thead>
          <tr>
            <th scope="col" className={head}>
              {m("explained.tdh.sure.split.about")}
            </th>
            <th scope="col" className={head}>
              {m("explained.tdh.sure.split.proved")}
            </th>
            <th scope="col" className={head}>
              {m("explained.tdh.sure.split.shownFalse")}
            </th>
            <th scope="col" className={head}>
              {m("explained.tdh.sure.split.audited")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} data-split-row={row.id}>
              <th
                scope="row"
                className={`${cell} tw-text-left tw-font-semibold ${row.id === "all" ? "tw-text-iron-50" : "tw-text-iron-300"}`}
              >
                {row.name}
              </th>
              <td className={cell}>{row.proved}</td>
              <td className={cell}>{row.shownFalse}</td>
              <td className={cell}>{row.audited}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
