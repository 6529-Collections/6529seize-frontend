"use client";

/* istanbul ignore file */
import { useRef } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import type { CreateWaveConfig, CreateWaveStep } from "@/types/waves.types";
import CreateWaveFlow from "./CreateWaveFlow";
import CreateWaveLayout from "./CreateWaveLayout";
import CreateWaveStepContent from "./CreateWaveStepContent";
import type { CreateWaveDescriptionHandles } from "./description/CreateWaveDescription";
import { useCreateWaveSubmission } from "./hooks/useCreateWaveSubmission";
import { useWaveConfig } from "./hooks/useWaveConfig";

export default function CreateWave({
  locale = DEFAULT_LOCALE,
  profile,
  onBack,
  onSuccess,
  parentWaveId,
  initialConfig,
}: {
  readonly locale?: SupportedLocale | undefined;
  readonly profile: ApiIdentity;
  readonly onBack: () => void;
  readonly onSuccess?: (() => void) | undefined;
  readonly parentWaveId?: string | null | undefined;
  readonly initialConfig?: CreateWaveConfig | undefined;
}) {
  const waveConfig = useWaveConfig(initialConfig);
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
    parentWaveId,
  });

  const setStep = (
    targetStep: CreateWaveStep,
    direction: "forward" | "backward"
  ) => {
    onStep({ step: targetStep, direction });
  };

  return (
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
          locale={locale}
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
