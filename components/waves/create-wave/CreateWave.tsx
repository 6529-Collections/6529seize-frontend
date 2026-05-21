"use client";

/* istanbul ignore file */
import { useRef } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { CreateWaveStep } from "@/types/waves.types";
import CreateWaveFlow from "./CreateWaveFlow";
import CreateWaveLayout from "./CreateWaveLayout";
import CreateWaveStepContent from "./CreateWaveStepContent";
import type { CreateWaveDescriptionHandles } from "./description/CreateWaveDescription";
import { useCreateWaveSubmission } from "./hooks/useCreateWaveSubmission";
import { useWaveConfig } from "./hooks/useWaveConfig";

export default function CreateWave({
  profile,
  onBack,
  onSuccess,
}: {
  readonly profile: ApiIdentity;
  readonly onBack: () => void;
  readonly onSuccess?: (() => void) | undefined;
}) {
  const waveConfig = useWaveConfig();
  const { config, step, selectedOutcomeType, onStep } = waveConfig;
  const descriptionRef = useRef<CreateWaveDescriptionHandles | null>(null);
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
  });

  const setStep = (
    targetStep: CreateWaveStep,
    direction: "forward" | "backward"
  ) => {
    onStep({ step: targetStep, direction });
  };

  return (
    <CreateWaveFlow
      title={`Create Wave ${
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
  );
}
