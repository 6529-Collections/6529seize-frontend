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
  nextDisabled = false,
  setStep,
  onComplete,
}: {
  readonly children: ReactNode;
  readonly config: CreateWaveConfig;
  readonly step: CreateWaveStep;
  readonly showActions: boolean;
  readonly submitting: boolean;
  readonly nextDisabled?: boolean | undefined;
  readonly setStep: (
    step: CreateWaveStep,
    direction: "forward" | "backward"
  ) => Promise<void>;
  readonly onComplete: () => Promise<void>;
}) {
  const { canScrollDown } = useCreateWaveScrollHint();

  return (
    <div className="tw-relative tw-flex tw-h-max tw-min-h-full tw-w-full tw-shrink-0 lg:after:tw-pointer-events-none lg:after:tw-absolute lg:after:tw-inset-y-0 lg:after:tw-left-52 lg:after:tw-z-20 lg:after:tw-w-px lg:after:tw-bg-white/[0.06] lg:after:tw-content-['']">
      <div className="tw-hidden lg:tw-flex lg:tw-w-52 lg:tw-shrink-0 lg:tw-bg-[#09090B] lg:tw-py-8 lg:tw-pl-8 lg:tw-pr-5">
        <CreateWavesMainSteps
          activeStep={step}
          waveType={config.overview.type}
          ongoingRanking={config.dates?.ongoingRanking ?? false}
          disabled={submitting}
          onStep={(targetStep) => {
            void setStep(targetStep, "backward");
          }}
        />
      </div>
      <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-bg-iron-950">
        <div className="tw-relative tw-flex tw-min-h-[34rem] tw-w-full tw-flex-1 tw-flex-col">
          {/* Joined to the top of the flow: the compact step progress pins to
              the top of the create-wave scrollport (mirror of the sticky
              footer), so it reads as one header row with the app shell's back
              arrow and never scrolls away underneath it. It carries its own
              opaque background + bottom border so scrolled content passes
              cleanly behind it. */}
          <div className="tw-sticky tw-top-0 tw-z-20 tw-flex-shrink-0">
            <CreateWaveMobileProgress
              activeStep={step}
              ongoingRanking={config.dates.ongoingRanking ?? false}
              waveType={config.overview.type}
            />
          </div>
          <div className="tw-w-full tw-flex-1 tw-p-4 lg:tw-p-8">{children}</div>
          {showActions ? (
            // The footer pins to the live scroller so Prev/Next stay reachable.
            // It uses the same opaque surface as the flow so the content column
            // reads as one continuous background at every scroll position.
            <div
              // Bottom inset: clear the iOS home affordance without the
              // oversized gap the full inset + 1rem produced. Mirrors the app's
              // BottomNavigation approach (trim the inset rather than add to
              // it), but a touch more conservative — subtract 0.5rem with a
              // 0.5rem floor on phones. Medium modal layouts use a 1rem floor
              // so the action row stays balanced, while still honoring a
              // larger device safe area. Scales per device via env(); never
              // goes flush.
              className={`tw-sticky tw-bottom-0 tw-z-10 tw-mt-auto tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-bg-iron-950 tw-px-4 tw-pb-[max(calc(env(safe-area-inset-bottom,0px)_-_0.5rem),0.5rem)] tw-pt-4 tw-transition-colors tw-duration-200 motion-reduce:tw-transition-none md:tw-pb-[max(env(safe-area-inset-bottom,0px),1rem)] lg:tw-px-8 lg:tw-pb-5 lg:tw-pt-5 ${
                canScrollDown ? "tw-border-white/25" : "tw-border-white/[0.08]"
              }`}
            >
              <CreateWaveActions
                setStep={setStep}
                step={step}
                config={config}
                submitting={submitting}
                nextDisabled={nextDisabled}
                onComplete={onComplete}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
