import { SubmissionStatus, type useWave } from "@/hooks/useWave";
import type { SupportedLocale } from "@/i18n/locales";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import type { DisplayTimeZone } from "@/lib/display-time-zone/displayTimeZone";
import type { WaveSubmissionHelpAction } from "@/components/waves/header/WaveSubmissionHelpDialog";
import { formatSubmissionWindowTime } from "../waveDropAction.helpers";

/** Present the existing participation result; never infer submission permission here. */
export function getMemesSubmissionHelp(
  participation: NonNullable<ReturnType<typeof useWave>>["participation"],
  zone: DisplayTimeZone,
  locale: SupportedLocale
): WaveSubmissionHelpAction | null {
  if (participation.status === SubmissionStatus.ENDED) {
    return {
      label: t(locale, "waves.dropEligibility.closed"),
      restrictionMessage: participation.endTime
        ? t(locale, "waves.dropEligibility.closedAt", {
            date: formatSubmissionWindowTime(participation.endTime, zone),
          })
        : t(locale, "waves.dropEligibility.closedReason"),
    };
  }
  if (participation.status === SubmissionStatus.NOT_STARTED) {
    return {
      label: t(locale, "waves.dropEligibility.openSoon"),
      restrictionMessage: participation.startTime
        ? t(locale, "waves.dropEligibility.opensAt", {
            date: formatSubmissionWindowTime(participation.startTime, zone),
          })
        : t(locale, "waves.dropEligibility.opensSoonReason"),
    };
  }
  // Entries move to the 6529 Network: paused, whoever may submit.
  if (participation.isPausedForMove) {
    return {
      label: t(locale, "wavesMove.submissionsPaused"),
      restrictionMessage: t(locale, "wavesMove.paused"),
    };
  }
  if (participation.isEligible === false) {
    return {
      label: t(locale, "waves.dropEligibility.howToSubmit"),
      restrictionMessage: null,
      restrictionKind: "memes-nomination",
    };
  }
  if (participation.hasReachedLimit) {
    const maximum = participation.maxSubmissions ?? "?";
    return {
      label: t(locale, "waves.dropEligibility.limitReached"),
      restrictionMessage: t(
        locale,
        maximum === 1
          ? "waves.dropEligibility.limitOneReason"
          : "waves.dropEligibility.limitManyReason",
        {
          count:
            typeof maximum === "number"
              ? formatInteger(locale, maximum)
              : maximum,
        }
      ),
    };
  }
  return participation.canSubmitNow
    ? null
    : {
        label: t(locale, "waves.dropEligibility.unavailable"),
        restrictionMessage: t(
          locale,
          "waves.dropEligibility.unavailableReason"
        ),
      };
}
