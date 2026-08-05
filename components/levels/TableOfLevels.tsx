import levels from "@/constants/levels.json";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";

interface LevelData {
  level: number;
  threshold: number;
}

export default function TableOfLevels() {
  const locale = useBrowserLocale();
  const caption = t(locale, "network.levels.table.accessibleCaption");

  return (
    <div className="tw-flex tw-w-full tw-flex-col">
      <div
        className="tw-max-h-[34rem] tw-w-full tw-overflow-auto tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950/60 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-800 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-white/20 desktop-hover:hover:tw-scrollbar-thumb-iron-700"
        tabIndex={0 /* NOSONAR -- keyboard access for the scroll container */}
      >
        <table className="tw-m-0 tw-w-full tw-border-collapse tw-border-0">
          <caption className="tw-sr-only">{caption}</caption>
          <thead className="tw-bg-iron-900/80">
            <tr className="tw-border-0">
              <th
                className="tw-w-1/2 tw-border-0 tw-py-3.5 tw-pl-4 tw-pr-3 tw-text-left tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400 sm:tw-pl-6"
                scope="col"
              >
                {t(locale, "network.levels.table.level")}
              </th>
              <th
                className="tw-w-1/2 tw-border-0 tw-py-3.5 tw-pl-4 tw-pr-4 tw-text-right tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400 sm:tw-pr-6"
                scope="col"
              >
                {t(locale, "network.levels.table.tdhRep")}
              </th>
            </tr>
          </thead>
          <tbody className="tw-divide-y tw-divide-white/[0.04] tw-bg-iron-950/40">
            {(levels as LevelData[]).map((level) => {
              const isMilestone = level.level !== 0 && level.level % 10 === 0;
              const isSubMilestone =
                level.level !== 0 && !isMilestone && level.level % 5 === 0;
              let numberClassName = "tw-text-iron-400";
              if (isMilestone) {
                numberClassName = "tw-text-[#00f0ff]";
              } else if (isSubMilestone) {
                numberClassName = "tw-text-iron-200";
              }

              return (
                <tr
                  key={`level-${level.level}`}
                  className="tw-border-0 tw-transition-colors tw-duration-200 tw-ease-out odd:tw-bg-white/[0.015] hover:tw-bg-white/[0.04] motion-reduce:tw-transition-none"
                >
                  <td
                    className={`tw-whitespace-nowrap tw-border-0 tw-py-3 tw-pl-4 tw-pr-3 tw-font-mono tw-text-[13px] tw-font-normal tw-tabular-nums sm:tw-pl-6 ${numberClassName}`}
                  >
                    {level.level}
                  </td>
                  <td
                    className={`tw-whitespace-nowrap tw-border-0 tw-py-3 tw-pl-4 tw-pr-4 tw-text-right tw-font-mono tw-text-[13px] tw-font-normal tw-tabular-nums sm:tw-pr-6 ${numberClassName}`}
                  >
                    {formatInteger(locale, level.threshold)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
