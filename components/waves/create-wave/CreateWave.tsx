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

  // Each step renders fresh content, but the layout's scroll container keeps
  // the offset where the user tapped Next (the bottom of the previous step),
  // landing them mid-page on taller steps like the announce-wave Dates step.
  // Reset every scrolled ancestor so each step starts at the top.
  useEffect(() => {
    let node: HTMLElement | null = containerRef.current;
    while (node) {
      if (node.scrollTop > 0) {
        node.scrollTop = 0;
      }
      node = node.parentElement;
    }
    window.scrollTo({ top: 0 });
  }, [step]);

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
    // The bottom safe-area region is inside the viewport (viewport-fit=cover)
    // and iOS Safari's floating bottom chrome overlays it; without this
    // padding the last row (Previous/Next) renders half-hidden behind it.
    <div
      ref={containerRef}
      className="create-wave-flow tw-pb-[env(safe-area-inset-bottom,0px)]"
    >
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
