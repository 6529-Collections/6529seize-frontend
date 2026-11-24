"use client";

import { useRef, useState } from "react";
import { MainStageNominationPopoverContent } from "@/components/brain/my-stream/tabs/MainStageNominationPopover";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import type { HeaderWaveDropAction } from "@/contexts/HeaderContext";
import { Time } from "@/helpers/time";
import { getWaveSubmissionClosure } from "@/helpers/waves/submission-closure";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useVisibleInterval } from "@/hooks/usePageVisibility";
import { t } from "@/i18n/messages";
import { WaveHeaderRestrictionContent } from "./WaveHeaderRestrictionButton";

export type WaveSubmissionHelpAction = Pick<
  HeaderWaveDropAction,
  | "label"
  | "restrictionMessage"
  | "restrictionKind"
  | "accessWave"
  | "onViewRules"
> &
  Partial<Pick<HeaderWaveDropAction, "canOpen">>;

/** Both phone submission explanations use the existing sheet and content. */
export default function WaveSubmissionHelpDialog({
  action,
  onClose,
}: {
  readonly action: WaveSubmissionHelpAction;
  readonly onClose: () => void;
}) {
  const locale = useBrowserLocale();
  const title = t(locale, "waves.dropEligibility.howToSubmit");
  const [isOpen, setIsOpen] = useState(true);
  const pendingNavigation = useRef<(() => void) | undefined>(undefined);
  const close = () => setIsOpen(false);
  const nomination = action.restrictionKind === "memes-nomination";
  const [now, setNow] = useState(() => Time.currentMillis());
  const accessWave = nomination ? undefined : action.accessWave;
  const closure = accessWave ? getWaveSubmissionClosure(accessWave, now) : null;
  useVisibleInterval(
    () => setNow(Time.currentMillis()),
    accessWave && !closure ? 1000 : null
  );
  const reason = closure
    ? t(locale, "waves.dropEligibility.ended")
    : (action.restrictionMessage ?? action.label);

  return (
    <MobileWrapperDialog
      isOpen={isOpen && action.canOpen !== true}
      onClose={close}
      onAfterLeave={() => {
        onClose();
        pendingNavigation.current?.();
      }}
      title={title}
      ariaLabel={title}
      headerVariant="minimal"
    >
      <div
        className="tw-px-4 tw-pb-6 sm:tw-px-6"
        onClickCapture={(event) => {
          if (
            !event.metaKey &&
            !event.ctrlKey &&
            !event.shiftKey &&
            !event.altKey &&
            event.button === 0 &&
            event.target instanceof Element &&
            event.target.closest("a[href]")
          )
            close();
        }}
      >
        {nomination ? (
          <MainStageNominationPopoverContent className="tw-w-full" />
        ) : (
          <WaveHeaderRestrictionContent
            label={action.label}
            reason={reason}
            accessWave={accessWave}
            onViewRules={
              action.onViewRules
                ? () => {
                    pendingNavigation.current = action.onViewRules;
                    close();
                  }
                : undefined
            }
            closure={closure}
            fullWidth
          />
        )}
      </div>
    </MobileWrapperDialog>
  );
}
