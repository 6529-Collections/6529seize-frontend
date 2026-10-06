import type { ApiCompetitionComputedPhase } from "@/generated/models/ApiCompetitionComputedPhase";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

const INACTIVE_PHASE_STYLE = "tw-bg-iron-800 tw-text-iron-300";

const PHASE_STYLES: Record<ApiCompetitionComputedPhase, string> = {
  DRAFT: INACTIVE_PHASE_STYLE,
  UPCOMING: "tw-bg-primary-400/10 tw-text-primary-300",
  PARTICIPATION_OPEN: "tw-bg-success/10 tw-text-success",
  VOTING_OPEN: "tw-bg-success/10 tw-text-success",
  DECIDING: "tw-bg-primary-400/10 tw-text-primary-300",
  COMPLETED: INACTIVE_PHASE_STYLE,
  CANCELLED: INACTIVE_PHASE_STYLE,
  ARCHIVED: INACTIVE_PHASE_STYLE,
};

export default function CompetitionPhaseBadge({
  phase,
}: {
  readonly phase: ApiCompetitionComputedPhase;
}) {
  const locale = useBrowserLocale();
  return (
    <span
      className={`tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-px-2.5 tw-py-1 tw-text-xs tw-font-medium ${PHASE_STYLES[phase]}`}
    >
      <span
        className="tw-size-1.5 tw-shrink-0 tw-rounded-full tw-bg-current"
        aria-hidden="true"
      />
      {t(locale, `competitions.phase.${phase}`)}
    </span>
  );
}
