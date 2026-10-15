import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import TdhRuleBlock from "../../shared/TdhRuleBlock";
import { TDH_CARD, TDH_LINK } from "../../shared/tdhStyles";
import { etherscanBlockUrl } from "./VerificationProvenance";
import { formatInteger } from "./verificationFormat";

/** The day's run, as the daily job's README gives it. */
export function dailyRunCommands(cycleDay: number): string {
  return `validator compute --day ${cycleDay} --out day/rust --store store
python3 tools/tdh-daily/python_compute.py --chain ../6529chain \\
    --input day/rust/canonical-input.jsonl.gz \\
    --rust-summary day/rust/summary.json --out day/python`;
}

/**
 * "Check it yourself": what anyone can verify today from public sources, and
 * the commands that reproduce the day once the source is published.
 */
export default function VerificationCheck({
  locale,
  cycleDay,
  cutoffBlock,
  liveSource,
}: {
  readonly locale: SupportedLocale;
  readonly cycleDay: number;
  readonly cutoffBlock: number | null;
  readonly liveSource: string | null;
}) {
  const uploadId = liveSource?.replace(/^arweave:/, "") ?? null;
  return (
    <section aria-labelledby="tdh-verify-check-heading" className="tw-mt-10">
      <h2
        id="tdh-verify-check-heading"
        className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-50"
      >
        {t(locale, "network.tdh.verify.check.heading")}
      </h2>
      <p className="tw-m-0 tw-mt-2 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-400">
        {t(locale, "network.tdh.verify.check.intro")}
      </p>
      <div className="tw-mt-4 tw-grid tw-gap-4 lg:tw-grid-cols-2">
        <div className={`${TDH_CARD} tw-p-5`}>
          <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
            {t(locale, "network.tdh.verify.check.today")}
          </h3>
          <ol className="tw-m-0 tw-mt-3 tw-space-y-3 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-300 marker:tw-text-iron-500">
            <li>
              {t(locale, "network.tdh.verify.check.upload")}
              {uploadId && (
                <>
                  {" "}
                  <a
                    href={`https://arweave.net/${uploadId}`}
                    className={TDH_LINK}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {t(locale, "network.tdh.verify.side.uploadLink", {
                      id: `${uploadId.slice(0, 6)}…`,
                    })}
                  </a>
                </>
              )}
            </li>
            <li>
              {t(locale, "network.tdh.verify.check.block")}
              {cutoffBlock !== null && (
                <>
                  {" "}
                  <a
                    href={etherscanBlockUrl(cutoffBlock)}
                    className={TDH_LINK}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {t(locale, "network.tdh.verify.provenance.explorer", {
                      block: formatInteger(locale, cutoffBlock),
                    })}
                  </a>
                </>
              )}
            </li>
            <li>{t(locale, "network.tdh.verify.check.file")}</li>
          </ol>
        </div>
        <div className={`${TDH_CARD} tw-min-w-0 tw-p-5`}>
          <h3 className="tw-m-0 tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-base tw-font-semibold tw-text-iron-50">
            {t(locale, "network.tdh.verify.check.source")}
            <span className="tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-dashed tw-border-iron-600 tw-px-2.5 tw-py-0.5 tw-text-xs tw-font-normal tw-text-iron-300">
              {t(locale, "network.tdh.shared.sourceToBePublished")}
            </span>
          </h3>
          <p className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(locale, "network.tdh.verify.check.sourceBody")}
          </p>
          <div className="tw-mt-3">
            <TdhRuleBlock
              code={dailyRunCommands(cycleDay)}
              locale={locale}
              label={t(locale, "network.tdh.verify.check.commands")}
              title={t(locale, "network.tdh.verify.check.commands")}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
