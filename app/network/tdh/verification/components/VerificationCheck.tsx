import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { VerificationDay } from "@/lib/tdh/verification/schema";
import TdhHeading from "../../shared/TdhHeading";
import TdhStatusPill from "../../shared/TdhStatusPill";
import TdhRuleBlock from "../../shared/TdhRuleBlock";
import { TDH_CARD, TDH_LINK } from "../../shared/tdhStyles";
import { arweaveTransactionUrl, etherscanBlockUrl } from "./verificationLinks";
import { formatInteger, middleTruncate } from "./verificationFormat";

/** The day's run, as the daily job's README gives it. */
function dailyRunCommands(cycleDay: number): string {
  return `validator compute --day ${cycleDay} --out day/rust --store store
python3 tools/tdh-daily/python_compute.py --chain ../6529chain \\
    --input day/rust/canonical-input.jsonl.gz \\
    --rust-summary day/rust/summary.json --out day/python
python3 -I tools/tdh-daily/three_way.py --day ${cycleDay} \\
    --rust day/rust --python day/python --out day/three-way \\
    --chain ../6529chain --cache cache`;
}

const STEP = "tw-pl-1";

/**
 * "Check it yourself": what anyone can verify today from public sources, what
 * that does not reach, and the commands that reproduce the day once the
 * source is published.
 */
export default function VerificationCheck({
  locale,
  day,
  cycleDay,
}: {
  readonly locale: SupportedLocale;
  readonly day: VerificationDay | null;
  readonly cycleDay: number;
}) {
  const live = day?.implementations.live ?? null;
  const identityUpload = (live?.sources?.identity ?? live?.source ?? null)
    ?.replace(/^arweave:/, "")
    .trim();
  const cutoffBlock = day?.cutoffBlock ?? null;
  return (
    <section
      id="check"
      aria-labelledby="check-heading"
      className="tw-mt-12 tw-scroll-mt-24"
    >
      <TdhHeading
        id="check"
        title={t(locale, "network.tdh.verify.check.heading")}
        locale={locale}
        className="tw-text-balance tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 min-[360px]:tw-text-2xl"
      />
      <p className="tw-m-0 tw-mt-2 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-400">
        {t(locale, "network.tdh.verify.check.intro")}
      </p>
      <div className="tw-mt-4 tw-grid tw-grid-cols-[minmax(0,1fr)] tw-items-start tw-gap-4 lg:tw-grid-cols-2">
        <div className={`${TDH_CARD} tw-min-w-0 tw-p-5 sm:tw-p-6`}>
          <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50">
            {t(locale, "network.tdh.verify.check.today")}
          </h3>
          <ol className="tw-m-0 tw-mt-3 tw-space-y-3 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-300 marker:tw-text-iron-500">
            <li className={STEP}>
              {t(locale, "network.tdh.verify.check.upload")}{" "}
              <a
                href="https://api.6529.io/api/consolidated_uploads"
                className={`${TDH_LINK} tw-break-words`}
                rel="noopener noreferrer"
                target="_blank"
              >
                {t(locale, "network.tdh.verify.check.apiLink")}
              </a>
              {identityUpload && (
                <>
                  {" "}
                  <a
                    href={arweaveTransactionUrl(identityUpload)}
                    className={`${TDH_LINK} tw-break-words`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {t(locale, "network.tdh.verify.check.uploadLink", {
                      id: middleTruncate(identityUpload, 5),
                    })}
                  </a>
                </>
              )}
            </li>
            <li className={STEP}>
              {t(locale, "network.tdh.verify.check.block")}
              {cutoffBlock !== null && (
                <>
                  {" "}
                  <a
                    href={etherscanBlockUrl(cutoffBlock)}
                    className={`${TDH_LINK} tw-break-words`}
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
            <li className={STEP}>
              {t(locale, "network.tdh.verify.check.file")}
            </li>
          </ol>
          <p className="tw-m-0 tw-mt-4 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-4 tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(locale, "network.tdh.verify.check.limit")}
          </p>
        </div>
        <div className={`${TDH_CARD} tw-min-w-0 tw-p-5 sm:tw-p-6`}>
          <h3 className="tw-m-0 tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-lg tw-font-semibold tw-text-iron-50">
            {t(locale, "network.tdh.verify.check.source")}
            <TdhStatusPill pill="toBePublished" locale={locale} size="sm" />
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
              wrap="words"
            />
          </div>
          <p className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(locale, "network.tdh.verify.check.compare")}
          </p>
        </div>
      </div>
    </section>
  );
}
