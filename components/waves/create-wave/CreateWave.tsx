"use client";

/* istanbul ignore file */
import { useEffect, useRef } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { CreateWaveStep } from "@/types/waves.types";
import CreateWaveFlow from "./CreateWaveFlow";
import CreateWaveLayout from "./CreateWaveLayout";
import CreateWaveStepContent from "./CreateWaveStepContent";
import type { CreateWaveDescriptionHandles } from "./description/CreateWaveDescription";
import type { CreateWaveDraft } from "@/helpers/waves/create-wave-draft.helpers";
import { useCreateWaveDrafts } from "./hooks/useCreateWaveDrafts";
import { useCreateWaveSubmission } from "./hooks/useCreateWaveSubmission";
import useKeyboardFocusScroll from "./hooks/useKeyboardFocusScroll";
import { useWaveConfig } from "./hooks/useWaveConfig";
import CreateWaveDraftsSection from "./overview/CreateWaveDraftsSection";

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
  const {
    config,
    step,
    selectedOutcomeType,
    onStep,
    errorFocusRequest,
    setConfig,
    endDateConfig,
    setEndDateConfig,
  } = waveConfig;
  const descriptionRef = useRef<CreateWaveDescriptionHandles | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  useKeyboardFocusScroll(containerRef);

  // Each step renders fresh content, but the layout's scroll container keeps
  // the offset where the user tapped Next (the bottom of the previous step),
  // landing them mid-page on taller steps like the announce-wave Dates step.
  // scrollIntoView moves only the ancestors that actually need it, by the
  // minimum amount — no walking into unrelated shells — and anchoring on the
  // container keeps the result independent of late-mounting step content.
  const previousStepRef = useRef(step);
  useEffect(() => {
    if (previousStepRef.current === step) {
      return;
    }
    previousStepRef.current = step;
    const frame = requestAnimationFrame(() => {
      containerRef.current?.scrollIntoView({ block: "start" });
    });
    return () => cancelAnimationFrame(frame);
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
  const { drafts, loadDraft, deleteDraft, clearActiveDraft } =
    useCreateWaveDrafts({ config, endDateConfig, step });

  const onLoadDraft = (draft: CreateWaveDraft) => {
    setConfig(draft.config);
    setEndDateConfig(draft.endDateConfig);
    loadDraft(draft);
  };

  const {
    submitting,
    showDropError,
    onHaveDropToSubmitChange,
    onInlineGroupCreate,
    onComplete,
  } = useCreateWaveSubmission({
    config,
    descriptionRef,
    // The draft is discarded only once the server has confirmed the wave —
    // a failed submit keeps the work recoverable.
    onSuccess: () => {
      clearActiveDraft();
      onSuccess?.();
    },
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
            overviewLeading={
              <CreateWaveDraftsSection
                drafts={drafts}
                onLoad={onLoadDraft}
                onDelete={deleteDraft}
              />
            }
            onHaveDropToSubmitChange={onHaveDropToSubmitChange}
            onInlineGroupCreate={onInlineGroupCreate}
          />
        </CreateWaveLayout>
      </CreateWaveFlow>
    </div>
  );
}
