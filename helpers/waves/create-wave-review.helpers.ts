import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { formatNumber, formatPercent } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  CreateWaveConfig,
  CreateWaveOutcomeConfig,
} from "@/types/waves.types";
import {
  CreateWaveOutcomeType,
  CreateWaveOutcomeConfigWinnersCreditValueType,
} from "@/types/waves.types";
import { buildWaveRules } from "./wave-rules.helpers";
import type {
  WaveRuleRow,
  WaveRuleSection,
  WaveRules,
} from "./wave-rules.shared";

function getOutcomeSection(
  outcome: CreateWaveOutcomeConfig,
  index: number,
  waveType: ApiWaveType,
  locale: SupportedLocale
): WaveRuleSection {
  const number = (value: number) =>
    formatNumber(locale, value, { maximumFractionDigits: 8 });
  const type =
    outcome.type === CreateWaveOutcomeType.MANUAL
      ? t(locale, "waves.create.review.manual")
      : outcome.type;
  const rows: WaveRuleRow[] = [
    {
      id: "type",
      label: t(locale, "waves.create.review.outcomeType"),
      value: type,
    },
  ];
  if (outcome.title) {
    rows.push({
      id: "title",
      label: t(locale, "waves.create.review.reward"),
      value: outcome.title,
    });
  }
  if (outcome.category) {
    rows.push({
      id: "category",
      label: t(locale, "waves.create.review.category"),
      value: outcome.category,
    });
  }
  const isManual = outcome.type === CreateWaveOutcomeType.MANUAL;
  if (waveType === ApiWaveType.Rank && outcome.winnersConfig) {
    const winners = outcome.winnersConfig;
    if (!isManual) {
      rows.push({
        id: "total",
        label: t(locale, "waves.create.review.total"),
        value: `${number(winners.totalAmount)} ${type}`,
      });
    }
    const isPercentage =
      winners.creditValueType ===
      CreateWaveOutcomeConfigWinnersCreditValueType.PERCENTAGE;
    rows.push(
      ...winners.winners.map((winner, winnerIndex) => ({
        id: `winner-${winnerIndex}`,
        label: t(locale, "waves.create.review.winner", {
          position: winnerIndex + 1,
        }),
        value: isPercentage
          ? formatPercent(locale, winner.value / 100, 8)
          : number(winner.value),
      }))
    );
  } else if (!isManual && outcome.credit !== null) {
    rows.push({
      id: "credit",
      label: t(locale, "waves.create.review.perApprovedDrop"),
      value: `${number(outcome.credit)} ${type}`,
    });
  }
  return {
    id: `outcome-${index}`,
    title: t(locale, "waves.create.review.outcome", { number: index + 1 }),
    rows,
  };
}

export function buildCreateWaveReview({
  config,
  groupsCache,
  locale,
  parentWaveName,
}: {
  readonly config: CreateWaveConfig;
  readonly groupsCache: Readonly<Record<string, ApiGroupFull>>;
  readonly locale: SupportedLocale;
  readonly parentWaveName?: string | null | undefined;
}): WaveRules {
  const rules = buildWaveRules({ config, groupsCache });
  const identityRows: WaveRuleRow[] = [
    {
      id: "name",
      label: t(locale, "waves.create.review.name"),
      value: config.overview.name,
    },
  ];
  if (parentWaveName) {
    identityRows.push({
      id: "parent",
      label: t(locale, "waves.create.review.parent"),
      value: parentWaveName,
    });
  }
  const automatic = rules.automatic.map((section) =>
    section.id === "overview"
      ? { ...section, rows: [...identityRows, ...section.rows] }
      : section
  );
  const supportsOutcomes =
    config.overview.type !== ApiWaveType.Chat &&
    !(config.overview.type === ApiWaveType.Rank && config.dates.ongoingRanking);
  if (supportsOutcomes) {
    automatic.push(
      ...config.outcomes.map((outcome, index) =>
        getOutcomeSection(outcome, index, config.overview.type, locale)
      )
    );
  }
  return { ...rules, automatic };
}
