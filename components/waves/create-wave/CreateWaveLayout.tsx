import type { ReactNode } from "react";
import type { CreateWaveConfig, CreateWaveStep } from "@/types/waves.types";
import useCapacitor from "@/hooks/useCapacitor";
import { useNativeKeyboard } from "@/hooks/useNativeKeyboard";
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
  const { isIos } = useCapacitor();
  const { isVisible: isKeyboardVisible } = useNativeKeyboard();

  return (
    <div className="tw-h-full tw-w-full lg:tw-flex">
      <div className="tw-hidden lg:tw-flex lg:tw-w-52 lg:tw-shrink-0 lg:tw-border-r lg:tw-border-solid lg:tw-border-white/[0.06] lg:tw-bg-[#09090B] lg:tw-py-8 lg:tw-pl-3 lg:tw-pr-5">
        <CreateWavesMainSteps
          activeStep={step}
          waveType={config.overview.type}
          onStep={(targetStep) => setStep(targetStep, "backward")}
        />
      </div>
      <div
        className={`tw-min-w-0 tw-flex-1 tw-bg-iron-950 tw-shadow-[-10px_0_30px_rgba(0,0,0,0.5)] ${
          isIos && !isKeyboardVisible ? "tw-mb-10" : ""
        }`}
      >
        <div className="tw-relative tw-flex tw-min-h-[34rem] tw-w-full tw-flex-col tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.06]">
          <div className="tw-w-full tw-flex-1 tw-p-4 lg:tw-p-8">{children}</div>
          {showActions ? (
            <div className="tw-mt-auto tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-bg-iron-950/95 tw-px-4 tw-pb-[calc(1rem+env(safe-area-inset-bottom,0px))] tw-pt-4 lg:tw-pl-8 lg:tw-pr-28 lg:tw-pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] lg:tw-pt-5">
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
