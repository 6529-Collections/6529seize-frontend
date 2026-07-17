"use client";

/* istanbul ignore file */
import { useEffect, useRef } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { CreateWaveStep } from "@/types/waves.types";
import CreateWaveFlow from "./CreateWaveFlow";
import CreateWaveLayout from "./CreateWaveLayout";
import CreateWaveStepContent from "./CreateWaveStepContent";
import type { CreateWaveDescriptionHandles } from "./description/CreateWaveDescription";
import { useCreateWaveSubmission } from "./hooks/useCreateWaveSubmission";
import useKeyboardFocusScroll from "./hooks/useKeyboardFocusScroll";
import { useWaveConfig } from "./hooks/useWaveConfig";

export default function CreateWave({
  profile,
  onBack,
  onSuccess,
  parentWaveId,
}: {
  readonly profile: ApiIdentity;
  readonly onBack: () => void;
  readonly onSuccess?: (() => void) | undefined;
  readonly parentWaveId?: string | null | undefined;
}) {
  const waveConfig = useWaveConfig();
  const { config, step, selectedOutcomeType, onStep, errorFocusRequest } =
    waveConfig;
  const descriptionRef = useRef<CreateWaveDescriptionHandles | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  useKeyboardFocusScroll(containerRef);

  // The Next button can sit a full screen below the offending field on
  // phones, where a validation failure with no visible reaction reads as a
  // dead button. Effects run after the error state commits, so the invalid
  // field is in the DOM by now — and scoping to the container keeps stray
  // aria-invalid fields elsewhere on the page from stealing the focus.
  useEffect(() => {
    if (!errorFocusRequest) {
      return;
    }
    const invalidField = containerRef.current?.querySelector(
      '[aria-invalid="true"]'
    );
    if (!(invalidField instanceof HTMLElement)) {
      return;
    }
    invalidField.focus({ preventScroll: true });
    invalidField.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [errorFocusRequest]);
  const {
    submitting,
    showDropError,
    onHaveDropToSubmitChange,
    onInlineGroupCreate,
    onComplete,
  } = useCreateWaveSubmission({
    config,
    descriptionRef,
    onSuccess,
    parentWaveId,
  });

  const setStep = (
    targetStep: CreateWaveStep,
    direction: "forward" | "backward"
  ) => {
    onStep({ step: targetStep, direction });
  };

  return (
    <div ref={containerRef}>
      <CreateWaveFlow
        title={`${parentWaveId ? "Create subwave" : "Create Wave"} ${
          config.overview.name ? `"${config.overview.name}"` : ""
        }`}
        onBack={onBack}
      >
        <CreateWaveLayout
          config={config}
          step={step}
          showActions={selectedOutcomeType === null}
          submitting={submitting}
          setStep={setStep}
          onComplete={onComplete}
        >
          <CreateWaveStepContent
            controller={waveConfig}
            profile={profile}
            descriptionRef={descriptionRef}
            submitting={submitting}
            showDropError={showDropError}
            onHaveDropToSubmitChange={onHaveDropToSubmitChange}
            onInlineGroupCreate={onInlineGroupCreate}
          />
        </CreateWaveLayout>
      </CreateWaveFlow>
    </div>
  );
}
