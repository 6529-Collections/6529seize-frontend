"use client";

/* istanbul ignore file */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { usePathname } from "next/navigation";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useLayout } from "@/components/brain/my-stream/layout/LayoutContext";
import { CreateWaveStep } from "@/types/waves.types";
import type { CreateWaveGroupConfigType } from "@/types/waves.types";
import CreateWaveFlow from "./CreateWaveFlow";
import CreateWaveLayout from "./CreateWaveLayout";
import CreateWaveStepContent from "./CreateWaveStepContent";
import type { CreateWaveDescriptionHandles } from "./description/CreateWaveDescription";
import type { CreateWaveDraft } from "@/helpers/waves/create-wave-draft.helpers";
import { isCreateWavePathname } from "@/helpers/waves/create-wave-route.helpers";
import { useCreateWaveDrafts } from "./hooks/useCreateWaveDrafts";
import { useCreateWaveSubmission } from "./hooks/useCreateWaveSubmission";
import useKeyboardFocusScroll from "./hooks/useKeyboardFocusScroll";
import { useSubwaveWaveConfig } from "./hooks/useSubwaveWaveConfig";
import CreateWaveDraftsSection from "./overview/CreateWaveDraftsSection";

export default function CreateWave({
  profile,
  onBack,
  onSuccess,
  parentWaveId,
  parentAdminGroupId,
}: {
  readonly profile: ApiIdentity;
  readonly onBack: () => void;
  readonly onSuccess?: (() => void) | undefined;
  readonly parentWaveId?: string | null | undefined;
  readonly parentAdminGroupId?: string | null | undefined;
}) {
  const waveConfig = useSubwaveWaveConfig({
    parentAdminGroupId,
  });
  const {
    config,
    step,
    selectedOutcomeType,
    onStep,
    errorFocusRequest,
    replaceConfig,
    endDateConfig,
    setEndDateConfig,
  } = waveConfig;
  const descriptionRef = useRef<CreateWaveDescriptionHandles | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [criteriaReplacementByGroup, setCriteriaReplacementByGroup] = useState<
    Partial<Record<CreateWaveGroupConfigType, boolean>>
  >({});
  const [groupResolutionByGroup, setGroupResolutionByGroup] = useState<
    Partial<Record<CreateWaveGroupConfigType, boolean>>
  >({});
  useKeyboardFocusScroll(containerRef);

  // On the native /waves/create route the create flow has no height-bounding
  // ancestor, so we hand CreateWaveFlow the layout system's measured content
  // height: the viewport minus the measured app header (create-wave hides the
  // bottom nav, so nothing else is subtracted). This bounds the scrollport
  // EXACTLY to the space below the header, so the surface never grows past the
  // viewport and the app-shell scroller can't ride the header (its back arrow)
  // up under the status bar.
  //
  // Deliberately NOT keyboard-aware (contentContainerStyle, not the wave views'
  // keyboard-following height): that height is stable regardless of keyboard
  // state, so the sticky footer sits in the SAME place whether or not the
  // keyboard has been opened — no shrink that gets stuck short and leaves a
  // black gap under the footer after moving between steps. Focused inputs are
  // kept visible by useKeyboardFocusScroll inside the scrollport; the bottom
  // safe-area is handled by the footer's own inset. The web modal bounds its
  // own height (no style); 100dvh is a brief pre-measurement fallback.
  const pathname = usePathname();
  const { isApp } = useDeviceInfo();
  const { contentContainerStyle } = useLayout();
  const isNativeRoute = isApp && isCreateWavePathname(pathname);
  const measuredOrFallbackStyle: CSSProperties =
    contentContainerStyle.height !== undefined
      ? contentContainerStyle
      : { height: "100dvh", maxHeight: "100dvh" };
  const nativeBoundedStyle: CSSProperties | undefined = isNativeRoute
    ? measuredOrFallbackStyle
    : undefined;

  // On step change, snap the create-wave scrollport back to its top so a new
  // (taller) step doesn't start mid-page. This is handled inside CreateWaveFlow
  // via scrollResetKey={step} — it resets THAT scrollport, not the app-shell
  // scroller. (The old approach, containerRef.scrollIntoView({block:"start"}),
  // scrolled the shell instead — riding the app header up under the status bar
  // and leaving a black gap at the bottom.)

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
      '[aria-invalid="true"], [data-wave-group-invalid="true"]'
    );
    if (!(invalidField instanceof HTMLElement)) {
      return;
    }
    invalidField.focus({ preventScroll: true });
    invalidField.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [errorFocusRequest]);
  const { drafts, loadDraft, deleteDraft, clearActiveDraft } =
    useCreateWaveDrafts({ config, endDateConfig, step });

  const resetTransientGroupState = useCallback(() => {
    setCriteriaReplacementByGroup({});
    setGroupResolutionByGroup({});
  }, []);

  const onLoadDraft = (draft: CreateWaveDraft) => {
    resetTransientGroupState();
    replaceConfig(draft.config);
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
    parentAdminGroupId,
  });

  const setStep = (
    targetStep: CreateWaveStep,
    direction: "forward" | "backward"
  ): Promise<void> => {
    if (targetStep !== CreateWaveStep.GROUPS) {
      resetTransientGroupState();
    }
    return onStep({ step: targetStep, direction });
  };

  const onCriteriaReplacementChange = useCallback(
    (groupType: CreateWaveGroupConfigType, active: boolean) => {
      setCriteriaReplacementByGroup((current) => {
        if (!!current[groupType] === active) {
          return current;
        }
        return { ...current, [groupType]: active };
      });
    },
    []
  );
  const onGroupResolutionChange = useCallback(
    (groupType: CreateWaveGroupConfigType, active: boolean) => {
      setGroupResolutionByGroup((current) => {
        if (!!current[groupType] === active) {
          return current;
        }
        return { ...current, [groupType]: active };
      });
    },
    []
  );
  const hasPendingCriteriaReplacement = Object.values(
    criteriaReplacementByGroup
  ).some(Boolean);
  const hasUnresolvedSelectedGroup = Object.values(groupResolutionByGroup).some(
    Boolean
  );

  const actionInProgress =
    submitting ||
    (step === CreateWaveStep.GROUPS && waveConfig.groupValidation.isFetching);

  return (
    // The bottom safe-area region is inside the viewport (viewport-fit=cover)
    // and iOS Safari's floating bottom chrome overlays it; without this
    // padding the last row (Previous/Next) renders half-hidden behind it.
    // The native-keyboard inset extends the scrollable area by the software
    // keyboard's height so the page can scroll the footer (and a focused
    // field) up above the keyboard instead of trapping it underneath.
    <div
      ref={containerRef}
      className="create-wave-flow tw-flex tw-min-h-0 tw-flex-1 tw-flex-col"
    >
      <CreateWaveFlow
        title={`${parentWaveId ? "Create subwave" : "Create Wave"} ${
          config.overview.name ? `"${config.overview.name}"` : ""
        }`}
        onBack={onBack}
        nativeBoundedStyle={nativeBoundedStyle}
        scrollResetKey={step}
      >
        <CreateWaveLayout
          config={config}
          step={step}
          showActions={selectedOutcomeType === null}
          submitting={actionInProgress}
          nextDisabled={
            hasPendingCriteriaReplacement || hasUnresolvedSelectedGroup
          }
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
            onCriteriaReplacementChange={onCriteriaReplacementChange}
            onGroupResolutionChange={onGroupResolutionChange}
            onInlineGroupCreate={onInlineGroupCreate}
          />
        </CreateWaveLayout>
      </CreateWaveFlow>
    </div>
  );
}
