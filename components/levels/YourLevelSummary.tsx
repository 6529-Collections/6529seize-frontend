import { getNextLevelThreshold } from "@/components/levels/levelThresholds";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/network-tdh";

type LevelSummaryProfile =
  | Pick<ApiIdentity, "level" | "rep" | "tdh">
  | Pick<ApiProfileMin, "level" | "rep" | "tdh">;

interface LevelTarget {
  readonly level: number;
  readonly tdhRepNeeded: number;
}

interface LevelProgress {
  readonly combinedTdhRep: number;
  readonly currentLevel: number;
  readonly target: LevelTarget | null;
}

function getLevelProgress(profile: LevelSummaryProfile): LevelProgress | null {
  const { level, rep, tdh } = profile;
  if (
    !Number.isInteger(level) ||
    level < 0 ||
    !Number.isFinite(rep) ||
    !Number.isFinite(tdh)
  ) {
    return null;
  }

  const combinedTdhRep = tdh + rep;
  if (!Number.isFinite(combinedTdhRep)) {
    return null;
  }

  // The API-assigned profile Level is authoritative. Local thresholds only
  // provide the next target and the remaining TDH + Rep shown beside it.
  // When the score already reaches the next threshold, the API's Level is
  // behind it (not yet recomputed, or set by an older rule), so no target is
  // shown. From level 602 up there is no exact next threshold.
  const next = getNextLevelThreshold(level);
  const target =
    next && next.threshold > combinedTdhRep
      ? { level: next.level, tdhRepNeeded: next.threshold - combinedTdhRep }
      : null;

  return { combinedTdhRep, currentLevel: level, target };
}

export default function YourLevelSummary({
  locale,
  profile,
}: {
  readonly locale: SupportedLocale;
  readonly profile: LevelSummaryProfile;
}) {
  const progress = getLevelProgress(profile);
  if (!progress) {
    return null;
  }

  return (
    <section
      aria-labelledby="your-level-heading"
      className="tw-mt-6 tw-grid tw-w-full tw-grid-cols-2 tw-gap-x-6 tw-gap-y-4 sm:tw-mt-8 md:tw-flex md:tw-w-fit md:tw-items-start md:tw-gap-x-10"
    >
      <div className="tw-min-w-0">
        <h2
          className="tw-m-0 tw-text-xs tw-font-normal tw-leading-4 tw-text-iron-500"
          id="your-level-heading"
        >
          {t(locale, "network.levels.yourLevel.title")}
        </h2>
        <p className="tw-m-0 tw-mt-0.5 tw-text-sm tw-font-semibold tw-tabular-nums tw-leading-5 tw-text-primary-300">
          {formatInteger(locale, progress.currentLevel)}
        </p>
      </div>

      <dl className="tw-contents">
        <div className="tw-min-w-0">
          <dt className="tw-text-xs tw-font-normal tw-leading-4 tw-text-iron-500">
            {t(locale, "network.levels.yourLevel.combined")}
          </dt>
          <dd className="tw-m-0 tw-mt-0.5 tw-text-sm tw-font-semibold tw-tabular-nums tw-leading-5 tw-text-iron-100">
            {formatInteger(locale, progress.combinedTdhRep)}
          </dd>
        </div>

        {progress.target && (
          <div className="tw-col-span-2 tw-min-w-0 md:tw-col-span-1">
            <dt className="tw-text-xs tw-font-normal tw-leading-4 tw-text-iron-500">
              {t(locale, "network.levels.yourLevel.target", {
                level: formatInteger(locale, progress.target.level),
              })}
            </dt>
            <dd className="tw-m-0 tw-mt-0.5 tw-text-sm tw-font-semibold tw-tabular-nums tw-leading-5 tw-text-iron-100">
              {t(locale, "network.levels.yourLevel.targetGap", {
                amount: formatInteger(locale, progress.target.tdhRepNeeded),
              })}
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}
