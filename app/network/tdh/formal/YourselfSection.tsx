import type { ReactNode } from "react";
import Mark from "@/components/explained/marks/Mark";
import { EX_LINK } from "@/components/explained/tokens";
import {
  CodeBlock,
  CodeName,
  EdSection,
  Prose,
} from "@/components/explained/reference/parts";
import type { SureContext } from "./sureShared";

/**
 * §07 Check it yourself: what a reader can repeat today, and what waits.
 * The manifest's counts and hash, with three commands; a theorem's line, at
 * the named commit; and the proofs themselves, which wait for the model's
 * source. Each step says who can do it.
 */
interface Step {
  readonly id: string;
  readonly who: "anyone" | "notYet";
  /** Who can do it, when it is narrower than "Anyone, today". */
  readonly whoText?: string;
  readonly title: string;
  readonly body: ReactNode;
  readonly extra?: ReactNode;
}

export default function YourselfSection({
  ctx,
}: {
  readonly ctx: SureContext;
}) {
  const { m, s, p, book, locale } = ctx;
  const url = book.maybe<string>("manifest.url")?.value;
  const steps: Step[] = [];
  if (url) {
    steps.push({
      id: "count",
      who: "anyone",
      title: s("explained.tdh.sure.yourself.count"),
      body: m("explained.tdh.sure.yourself.countBody"),
      extra: (
        <CodeBlock
          className="tw-mt-3"
          label={s("explained.tdh.sure.yourself.countLabel")}
          code={[
            `curl -s ${url} | jq .summary`,
            `curl -s ${url} | jq '.vectors[] | {id, passed, total}'`,
            `curl -s ${url} | sha256sum`,
          ].join("\n")}
        />
      ),
    });
  }
  steps.push(
    {
      id: "read",
      who: "anyone",
      whoText: s("explained.tdh.sure.yourself.anyoneStatements"),
      title: s("explained.tdh.sure.yourself.read"),
      body: m("explained.tdh.sure.yourself.readBody", {
        commit: <CodeName>{p.v("manifest.commit")}</CodeName>,
        link: (
          <a className={EX_LINK} href="#theorems">
            {s("explained.tdh.sure.yourself.readLink")}
          </a>
        ),
      }),
    },
    {
      id: "rerun",
      who: "notYet",
      title: s("explained.tdh.sure.yourself.rerun"),
      body: m("explained.tdh.sure.yourself.rerunBody", {
        generator: <CodeName wrap>{p.v("manifest.generator")}</CodeName>,
        command: <CodeName>lake build</CodeName>,
        commit: <CodeName>{p.v("manifest.commit")}</CodeName>,
        version: p.v("manifest.lean"),
      }),
    }
  );
  return (
    <EdSection
      id="yourself"
      tight={false}
      no="07"
      label={m("explained.tdh.sure.yourself.label")}
      title={m("explained.tdh.sure.yourself.title")}
    >
      <Prose>{m("explained.tdh.sure.yourself.body")}</Prose>
      <ol
        className="tw-m-0 tw-mt-6 tw-list-none tw-border-0 tw-border-t tw-border-solid tw-border-iron-700 tw-p-0"
        aria-label={s("explained.tdh.sure.yourself.list")}
      >
        {steps.map((step, index) => (
          <li
            key={step.id}
            className="tw-grid tw-grid-cols-[30px_minmax(0,1fr)] tw-gap-x-2.5 tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-4"
          >
            <span className="tw-text-[15px] tw-font-semibold tw-leading-[25px] tw-text-iron-400">
              {index + 1}
            </span>
            <div className="tw-min-w-0">
              <div className="tw-flex tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-x-4 tw-gap-y-1">
                <span className="tw-text-[17px] tw-font-semibold tw-leading-[25px] tw-text-iron-50">
                  {step.title}
                </span>
                {step.who === "anyone" ? (
                  <span className="tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.12em] tw-text-iron-400">
                    {step.whoText ?? s("explained.tdh.sure.yourself.anyone")}
                  </span>
                ) : (
                  <Mark kind="notYet" locale={locale} size="sm" />
                )}
              </div>
              <p className="tw-m-0 tw-mt-1.5 tw-max-w-[620px] tw-text-base tw-leading-[25px] tw-text-iron-300">
                {step.body}
              </p>
              {step.extra}
            </div>
          </li>
        ))}
      </ol>
    </EdSection>
  );
}
