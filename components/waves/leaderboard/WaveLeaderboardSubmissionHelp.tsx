"use client";

import MainStageNominationPopover from "@/components/brain/my-stream/tabs/MainStageNominationPopover";
import WaveHeaderRestrictionButton from "@/components/waves/header/WaveHeaderRestrictionButton";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import { t } from "@/i18n/messages";
import { useOptionalHeaderContext } from "@/contexts/HeaderContext";

/** A phone entry point to the existing submission explanation. */
export default function WaveLeaderboardSubmissionHelp({
  wave,
  nomination,
  reason,
}: {
  readonly wave: ApiWave;
  readonly nomination: boolean;
  readonly reason: string | null;
}) {
  const isPhone = useIsMobileLayoutViewport();
  const locale = useBrowserLocale();
  const header = useOptionalHeaderContext();
  const action =
    header?.waveDropAction?.waveId === wave.id ? header.waveDropAction : null;
  const showNomination = action
    ? action.restrictionKind === "memes-nomination"
    : nomination;
  if (!isPhone) return null;
  const label = t(locale, "waves.dropEligibility.howToSubmit");
  const className =
    "tw-min-h-11 tw-rounded tw-border-0 tw-bg-transparent tw-px-0 tw-text-xs tw-font-medium tw-text-iron-400 tw-underline tw-underline-offset-4 active:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400";
  return (
    <div className="tw-flex-none">
      {showNomination ? (
        <MainStageNominationPopover focusOnKeyboardActivation>
          <button type="button" className={className}>
            {label}
          </button>
        </MainStageNominationPopover>
      ) : (
        <WaveHeaderRestrictionButton
          label={label}
          reason={action?.restrictionMessage ?? reason ?? label}
          accessWave={action?.accessWave ?? wave}
          onViewRules={action?.onViewRules}
          className={className}
        >
          {label}
        </WaveHeaderRestrictionButton>
      )}
    </div>
  );
}
