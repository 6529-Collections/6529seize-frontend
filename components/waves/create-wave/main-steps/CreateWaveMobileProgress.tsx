import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { ApiWaveType } from "@/generated/models/ApiWaveType";
import {
  getCreateWaveStepLabel,
  getCreateWaveMainSteps,
} from "@/helpers/waves/waves.constants";
import { t } from "@/i18n/messages";
import type { CreateWaveStep } from "@/types/waves.types";
import { CreateWaveStep as Step } from "@/types/waves.types";

/**
 * Compact progress header for small screens, where the vertical step
 * navigator is hidden. Shows the current step name, position, and a thin
 * progress bar.
 */
export default function CreateWaveMobileProgress({
  waveType,
  ongoingRanking = false,
  activeStep,
  quickChat = false,
}: {
  readonly waveType: ApiWaveType;
  readonly ongoingRanking?: boolean;
  readonly activeStep: CreateWaveStep;
  readonly quickChat?: boolean;
}) {
  const locale = useBrowserLocale();
  const steps = quickChat
    ? [Step.OVERVIEW, Step.REVIEW]
    : getCreateWaveMainSteps({ waveType, ongoingRanking });
  const activeStepIndex = Math.max(steps.indexOf(activeStep), 0);
  const progressPercent = ((activeStepIndex + 1) / steps.length) * 100;
  const stepPositionText = t(locale, "waves.create.progress.step", {
    current: activeStepIndex + 1,
    total: steps.length,
  });
  const quickLabel = t(
    locale,
    activeStep === Step.REVIEW
      ? "waves.create.quick.reviewTitle"
      : "waves.create.quick.title"
  );

  return (
    <div
      className={`tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.06] tw-bg-[#09090B] tw-px-4 tw-py-3 ${quickChat ? "" : "lg:tw-hidden"}`}
    >
      <div className="tw-flex tw-items-baseline tw-justify-between tw-gap-2">
        <span className="tw-text-sm tw-font-semibold tw-text-iron-50">
          {quickChat
            ? quickLabel
            : getCreateWaveStepLabel({ step: activeStep, waveType, locale })}
        </span>
        <span className="tw-whitespace-nowrap tw-text-xs tw-font-medium tw-text-iron-400">
          {stepPositionText}
        </span>
      </div>
      <div
        aria-label={t(locale, "waves.create.progress.label")}
        aria-valuemax={steps.length}
        aria-valuemin={1}
        aria-valuenow={activeStepIndex + 1}
        aria-valuetext={stepPositionText}
        className="tw-mt-2 tw-h-1 tw-w-full tw-overflow-hidden tw-rounded-full tw-bg-iron-800"
        role="progressbar"
      >
        <div
          className="tw-h-full tw-rounded-full tw-bg-primary-500 tw-transition-all tw-duration-300 motion-reduce:tw-transition-none"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
