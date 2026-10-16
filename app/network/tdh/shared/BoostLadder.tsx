import { formatInteger, formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

interface BoostLadderValues {
  readonly fullSetToday: number;
  readonly highestToday: number;
  readonly fullSetAllSeasons: number;
  readonly highestEver: number;
}

type Rung = keyof BoostLadderValues;

const multiplier = (locale: SupportedLocale, value: number) =>
  formatNumber(locale, value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * The four boost figures the TDH pages quote, on one scale from 1.00: a full
 * set today, a full set once every scheduled season pays, today's highest
 * and the schedule's highest. One picture instead of four numbers in four
 * places.
 */
export default function BoostLadder({
  locale,
  values,
  eligibleMemes,
  lastSeason,
  gradients,
  cycle,
}: {
  readonly locale: SupportedLocale;
  readonly values: BoostLadderValues;
  /** The cycle the values are for, as a date: "Oct 16, 2026". */
  readonly cycle: string;
  readonly eligibleMemes: number;
  readonly lastSeason: number;
  readonly gradients: number;
}) {
  const rungs = (Object.keys(values) as Rung[]).sort(
    (a, b) => values[a] - values[b]
  );
  const span = Math.max(values.highestEver - 1, 0.01);
  const labelValues = {
    count: formatInteger(locale, eligibleMemes),
    last: formatInteger(locale, lastSeason),
    gradients: formatInteger(locale, gradients),
    cycle,
  };
  return (
    <figure
      id="boost-figures"
      className="tw-m-0 tw-scroll-mt-28 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-p-4 sm:tw-p-5"
    >
      <figcaption className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
        {t(locale, "network.tdh.rules.ladder.title")}
      </figcaption>
      <p className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "network.tdh.rules.ladder.intro")}
      </p>
      <ol className="tw-m-0 tw-mt-4 tw-list-none tw-space-y-3 tw-p-0">
        {rungs.map((rung) => {
          const width = Math.max(((values[rung] - 1) / span) * 100, 2);
          const today = rung === "fullSetToday" || rung === "highestToday";
          return (
            <li
              key={rung}
              className="tw-grid tw-grid-cols-[3.5rem_minmax(0,1fr)] tw-items-start tw-gap-x-3 tw-gap-y-1"
            >
              <span className="tw-text-base tw-font-semibold tw-tabular-nums tw-leading-6 tw-text-iron-50">
                {t(locale, "network.tdh.rules.ladder.value", {
                  value: multiplier(locale, values[rung]),
                })}
              </span>
              <span className="tw-min-w-0">
                <span className="tw-block tw-text-sm tw-leading-6 tw-text-iron-200">
                  {t(locale, `network.tdh.rules.ladder.${rung}`, labelValues)}
                </span>
                <span
                  aria-hidden="true"
                  className="tw-mt-1 tw-block tw-h-1.5 tw-overflow-hidden tw-rounded-full tw-bg-iron-800"
                >
                  <span
                    className={`tw-block tw-h-full tw-rounded-full ${today ? "tw-bg-primary-400" : "tw-bg-iron-500"}`}
                    style={{ width: `${width}%` }}
                  />
                </span>
              </span>
            </li>
          );
        })}
      </ol>
      <p className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-5 tw-text-iron-400">
        {t(locale, "network.tdh.rules.ladder.note")}
      </p>
    </figure>
  );
}
