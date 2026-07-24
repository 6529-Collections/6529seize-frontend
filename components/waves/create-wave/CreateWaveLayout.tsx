import type { ReactNode } from "react";
import type { CreateWaveConfig, CreateWaveStep } from "@/types/waves.types";
import { useCreateWaveScrollHint } from "./hooks/useCreateWaveScrollHint";
import CreateWaveMobileProgress from "./main-steps/CreateWaveMobileProgress";
import CreateWavesMainSteps from "./main-steps/CreateWavesMainSteps";
import CreateWaveActions from "./utils/CreateWaveActions";

export default function CreateWaveLayout({
  children,
  config,
  step,
  showActions,
  submitting,
  setStep,
  onComplete,
}: {
  readonly children: ReactNode;
  readonly config: CreateWaveConfig;
  readonly step: CreateWaveStep;
  readonly showActions: boolean;
  readonly submitting: boolean;
  readonly setStep: (
    step: CreateWaveStep,
    direction: "forward" | "backward"
  ) => void;
  readonly onComplete: () => Promise<void>;
}) {
  const { canScrollDown } = useCreateWaveScrollHint();

  return (
    <div className="tw-h-full tw-w-full lg:tw-flex">
      <div className="tw-hidden lg:tw-flex lg:tw-w-52 lg:tw-shrink-0 lg:tw-border-r lg:tw-border-solid lg:tw-border-white/[0.06] lg:tw-bg-[#09090B] lg:tw-py-8 lg:tw-pl-3 lg:tw-pr-5">
        <CreateWavesMainSteps
          activeStep={step}
          waveType={config.overview.type}
          ongoingRanking={config.dates?.ongoingRanking ?? false}
          onStep={(targetStep) => setStep(targetStep, "backward")}
        />
      </div>
      <div className="tw-min-w-0 tw-flex-1 tw-bg-iron-950 tw-shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
        <div className="tw-relative tw-flex tw-min-h-[34rem] tw-w-full tw-flex-col tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.06]">
          <CreateWaveMobileProgress
            activeStep={step}
            ongoingRanking={config.dates?.ongoingRanking ?? false}
            waveType={config.overview.type}
          />
          <div className="tw-w-full tw-flex-1 tw-p-4 lg:tw-p-8">{children}</div>
          {showActions ? (
            // Sticky liquid-glass footer: pins to the live scroller (modal
            // container or native document) so Prev/Next stay reachable. It's
            // dramatically translucent (/10) with only a light blur so content
            // shows *through* it (see-through, not a frosted panel) — the
            // clearest "there's more under here" cue
            // on a near-black UI, where a same-tone dark fade is invisible. The
            // glass lip (inset highlight + top border) brightens while more
            // content sits below the fold and dims at the end of the step, and
            // a soft light glow rides above the edge as an extra hint.
            <div
              className={`tw-sticky tw-bottom-0 tw-z-10 tw-mt-auto tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-bg-iron-950/10 tw-px-4 tw-pb-[calc(1rem+env(safe-area-inset-bottom,0px))] tw-pt-4 tw-shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] tw-backdrop-blur-md tw-transition-colors tw-duration-200 motion-reduce:tw-transition-none lg:tw-pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] lg:tw-pl-8 lg:tw-pr-28 lg:tw-pt-5 ${
                canScrollDown ? "tw-border-white/25" : "tw-border-white/[0.08]"
              }`}
            >
              <div
                aria-hidden="true"
                className={`tw-pointer-events-none tw-absolute tw-inset-x-0 tw-top-0 tw-h-8 -tw-translate-y-full tw-bg-gradient-to-t tw-from-white/[0.06] tw-to-transparent tw-transition-opacity tw-duration-200 motion-reduce:tw-transition-none ${
                  canScrollDown ? "tw-opacity-100" : "tw-opacity-0"
                }`}
              />
              <CreateWaveActions
                setStep={setStep}
                step={step}
                config={config}
                submitting={submitting}
                onComplete={onComplete}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
