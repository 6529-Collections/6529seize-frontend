"use client";

import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import PrimaryButton from "@/components/utils/button/PrimaryButton";
import { trapTabFocus } from "@/components/utils/modal/focusTrap";
import CreateDropReplyingWrapper from "@/components/waves/CreateDropReplyingWrapper";
import type { DropMutationBody } from "@/components/waves/CreateDrop";
import { ProcessIncomingDropType } from "@/contexts/wave/hooks/useWaveRealtimeUpdater";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useDropSignature } from "@/hooks/drops/useDropSignature";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import { ActiveDropAction } from "@/types/dropInteractionTypes";
import { XMarkIcon } from "@heroicons/react/24/outline";
import dynamic from "next/dynamic";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { getOptimisticDrop } from "../utils/getOptimisticDrop";
import {
  buildQuorumProposalMarkdown,
  EMPTY_QUORUM_PROPOSAL_FORM_VALUES,
  hasQuorumProposalContent,
  type QuorumProposalFormValues,
  type QuorumProposalUrgency,
} from "./quorumProposalMarkdown";

const TermsSignatureFlow = dynamic(
  () => import("@/components/terms/TermsSignatureFlow"),
  { loading: () => null }
);

interface QuorumProposalDropModalProps {
  readonly isOpen: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly onCancelReplyQuote: () => void;
  readonly wave: ApiWave;
  readonly dropId: string | null;
  readonly submitDrop: (dropRequest: DropMutationBody) => void;
  readonly onClose: () => void;
  readonly termsSignatureFlowEnabled?: boolean | undefined;
}

interface QuorumProposalStep {
  readonly title: string;
  readonly description: string;
  readonly fields: readonly QuorumProposalField[];
}

type QuorumProposalField =
  | {
      readonly type: "textarea";
      readonly name: keyof Omit<QuorumProposalFormValues, "urgency">;
      readonly label: string;
      readonly placeholder: string;
      readonly rows?: number | undefined;
    }
  | {
      readonly type: "urgency";
      readonly name: "urgency";
      readonly label: string;
    };

const QUORUM_PROPOSAL_STEPS: readonly QuorumProposalStep[] = [
  {
    title: "Title & Summary",
    description: "Set the proposal name and the shortest useful explanation.",
    fields: [
      {
        type: "textarea",
        name: "title",
        label: "Title",
        placeholder: "QUORUM Proposal Template (Governance)",
        rows: 2,
      },
      {
        type: "textarea",
        name: "summary",
        label: "Summary",
        placeholder: "What is being proposed and why it matters.",
        rows: 4,
      },
    ],
  },
  {
    title: "Problem & Solution",
    description: "Make the need and the proposed change easy to compare.",
    fields: [
      {
        type: "textarea",
        name: "problemStatement",
        label: "Problem Statement",
        placeholder: "What problem are we solving?",
        rows: 5,
      },
      {
        type: "textarea",
        name: "proposedSolution",
        label: "Proposed Solution",
        placeholder: "What changes if this is implemented?",
        rows: 5,
      },
    ],
  },
  {
    title: "Working Spec",
    description: "Describe what needs to be built in practical terms.",
    fields: [
      {
        type: "textarea",
        name: "coreFeatures",
        label: "Core features",
        placeholder: "Feature 1, feature 2, feature 3...",
      },
      {
        type: "textarea",
        name: "userFlow",
        label: "User flow",
        placeholder: "Step-by-step user path.",
      },
      {
        type: "textarea",
        name: "edgeCases",
        label: "Edge cases",
        placeholder: "What if...",
      },
      {
        type: "textarea",
        name: "scopeBoundaries",
        label: "What is NOT included",
        placeholder: "Scope boundaries.",
      },
    ],
  },
  {
    title: "Path & Priority",
    description: "State the implementation path and priority signal.",
    fields: [
      {
        type: "textarea",
        name: "implementationPath",
        label: "Implementation Path",
        placeholder: "Step 1, step 2, step 3.",
      },
      {
        type: "textarea",
        name: "whoBenefits",
        label: "Who benefits",
        placeholder: "Primary beneficiaries.",
      },
      {
        type: "textarea",
        name: "whatImproves",
        label: "What improves",
        placeholder: "Outcome or operational improvement.",
      },
      {
        type: "urgency",
        name: "urgency",
        label: "Urgency level",
      },
    ],
  },
  {
    title: "Success & Risks",
    description: "Define what success looks like and what could go wrong.",
    fields: [
      {
        type: "textarea",
        name: "observableOutcome",
        label: "Observable outcome",
        placeholder: "What visible result confirms this worked?",
      },
      {
        type: "textarea",
        name: "measurableSignal",
        label: "Measurable signal",
        placeholder: "Metric or signal, if possible.",
      },
      {
        type: "textarea",
        name: "risksTradeoffs",
        label: "Risks & Trade-offs",
        placeholder: "Technical, UX, governance, or priority risks.",
        rows: 5,
      },
    ],
  },
];

export default function QuorumProposalDropModal({
  isOpen,
  activeDrop,
  onCancelReplyQuote,
  wave,
  dropId,
  submitDrop,
  onClose,
  termsSignatureFlowEnabled = true,
}: QuorumProposalDropModalProps) {
  const canUseDOM = typeof document !== "undefined";
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const { isApp } = useDeviceInfo();
  const { isSafeWallet, address } = useSeizeConnectContext();
  const { requestAuth, setToast, connectedProfile } = useContext(AuthContext);
  const { addOptimisticDrop } = useContext(ReactQueryWrapperContext);
  const { processIncomingDrop } = useMyStream();
  const { signDrop } = useDropSignature();
  const [values, setValues] = useState<QuorumProposalFormValues>(
    EMPTY_QUORUM_PROPOSAL_FORM_VALUES
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showValidation, setShowValidation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const hasProposalContent = useMemo(
    () => hasQuorumProposalContent(values),
    [values]
  );
  const proposalMarkdown = useMemo(
    () => buildQuorumProposalMarkdown(values),
    [values]
  );
  const currentStep = QUORUM_PROPOSAL_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === QUORUM_PROPOSAL_STEPS.length - 1;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const activeElement = document.activeElement;
    previouslyFocusedElementRef.current =
      activeElement instanceof HTMLElement ? activeElement : null;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusInitialTarget = () => {
      const initialTarget =
        closeButtonRef.current ?? titleRef.current ?? panelRef.current;
      initialTarget?.focus();
    };
    focusInitialTarget();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const panel = panelRef.current;
      if (!panel) {
        return;
      }

      trapTabFocus(event, panel);
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", onKeyDown);

      const previouslyFocusedElement = previouslyFocusedElementRef.current;
      if (previouslyFocusedElement?.isConnected) {
        previouslyFocusedElement.focus();
      }
      previouslyFocusedElementRef.current = null;
    };
  }, [isOpen]);

  const updateField = useCallback(
    <T extends keyof QuorumProposalFormValues>(
      field: T,
      value: QuorumProposalFormValues[T]
    ) => {
      setValues((current) => ({
        ...current,
        [field]: value,
      }));
    },
    []
  );

  const getUpdatedDropRequest = useCallback(
    async (
      requestBody: ApiCreateDropRequest
    ): Promise<ApiCreateDropRequest | null> => {
      if (!wave.participation.signature_required) {
        return requestBody;
      }

      if (!wave.participation.terms) {
        const { success, signature, signatureMessage } = await signDrop({
          drop: requestBody,
          termsOfService: null,
        });

        if (!success || !signature) {
          return null;
        }

        return {
          ...requestBody,
          signature,
          ...(signatureMessage ? { signature_message: signatureMessage } : {}),
        };
      }

      return new Promise<ApiCreateDropRequest | null>((resolve) => {
        const handleSigningComplete = (result: {
          success: boolean;
          signature?: string | undefined;
          signatureMessage?: string | undefined;
        }) => {
          if (!result.success || !result.signature) {
            resolve(null);
            return;
          }

          resolve({
            ...requestBody,
            signature: result.signature,
            ...(result.signatureMessage
              ? { signature_message: result.signatureMessage }
              : {}),
          });
        };

        const event = new CustomEvent("showTermsModal", {
          detail: {
            drop: requestBody,
            termsOfService: wave.participation.terms,
            onComplete: handleSigningComplete,
          },
        });
        document.dispatchEvent(event);
      });
    },
    [wave.participation.signature_required, wave.participation.terms, signDrop]
  );

  const hideMobileKeyboard = useCallback(() => {
    if (!isApp) {
      return;
    }

    void (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (Capacitor.getPlatform() !== "android") {
          return;
        }
        const { Keyboard } = await import("@capacitor/keyboard");
        await Keyboard.hide();
      } catch {
        // Ignore keyboard cleanup failures.
      }
    })();
  }, [isApp]);

  const onSubmitSuccess = useCallback(() => {
    setValues(EMPTY_QUORUM_PROPOSAL_FORM_VALUES);
    setCurrentStepIndex(0);
    setShowValidation(false);
    setSubmitting(false);
    onClose();
  }, [onClose]);

  const submitQuorumProposalDrop = useCallback(async () => {
    if (submitting) {
      return;
    }

    if (!hasProposalContent) {
      setShowValidation(true);
      return;
    }

    setSubmitting(true);
    let queuedForSubmit = false;

    try {
      const { success } = await requestAuth();
      if (!success) {
        return;
      }

      const quotedDrop =
        activeDrop?.action === ActiveDropAction.QUOTE
          ? {
              drop_id: activeDrop.drop.id,
              drop_part_id: activeDrop.partId,
            }
          : null;
      const replyTo =
        activeDrop?.action === ActiveDropAction.REPLY
          ? {
              drop_id: activeDrop.drop.id,
              drop_part_id: activeDrop.partId,
            }
          : undefined;

      const requestBody: ApiCreateDropRequest = {
        wave_id: wave.id,
        ...(replyTo ? { reply_to: replyTo } : {}),
        drop_type: ApiDropType.Participatory,
        title: null,
        parts: [
          {
            content: proposalMarkdown,
            quoted_drop: quotedDrop,
            media: [],
          },
        ],
        referenced_nfts: [],
        mentioned_users: [],
        mentioned_waves: [],
        metadata: [],
        signature: null,
        is_safe_signature: isSafeWallet,
        signer_address: address ?? "",
      };

      const updatedDropRequest = await getUpdatedDropRequest(requestBody);
      if (!updatedDropRequest) {
        return;
      }

      const optimisticDrop = getOptimisticDrop(
        updatedDropRequest,
        connectedProfile,
        wave,
        activeDrop,
        ApiDropType.Participatory
      );

      if (optimisticDrop) {
        void addOptimisticDrop({ drop: optimisticDrop });
        setTimeout(() => {
          processIncomingDrop(
            optimisticDrop,
            ProcessIncomingDropType.DROP_INSERT
          );
        }, 0);
      }

      const active = document.activeElement;
      if (active instanceof HTMLElement) {
        active.blur();
      }
      hideMobileKeyboard();

      submitDrop({
        drop: updatedDropRequest,
        dropId: optimisticDrop?.id ?? null,
        onSuccess: onSubmitSuccess,
        onError: () => setSubmitting(false),
      });
      queuedForSubmit = true;
    } catch (error) {
      setToast({
        type: "error",
        title: "Couldn't submit this proposal.",
        description: "Please try again.",
        details: getToastErrorDetails(error),
      });
    } finally {
      if (!queuedForSubmit) {
        setSubmitting(false);
      }
    }
  }, [
    submitting,
    hasProposalContent,
    requestAuth,
    activeDrop,
    wave,
    proposalMarkdown,
    isSafeWallet,
    address,
    getUpdatedDropRequest,
    connectedProfile,
    addOptimisticDrop,
    processIncomingDrop,
    hideMobileKeyboard,
    submitDrop,
    onSubmitSuccess,
    setToast,
  ]);

  const onSubmitClick = useCallback(() => {
    void submitQuorumProposalDrop();
  }, [submitQuorumProposalDrop]);

  const renderField = (field: QuorumProposalField): React.ReactNode => {
    if (field.type === "urgency") {
      return (
        <label key={field.name} className="tw-block">
          <span className="tw-mb-2 tw-block tw-text-sm tw-font-semibold tw-text-iron-100">
            {field.label}
          </span>
          <select
            value={values.urgency}
            onChange={(event) =>
              updateField(
                "urgency",
                event.target.value as QuorumProposalUrgency
              )
            }
            className="tw-form-select tw-block tw-h-11 tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-text-sm tw-text-iron-50 tw-ring-1 tw-ring-inset tw-ring-iron-700 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400"
          >
            <option value="">Select urgency</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </label>
      );
    }

    return (
      <label key={field.name} className="tw-block">
        <span className="tw-mb-2 tw-block tw-text-sm tw-font-semibold tw-text-iron-100">
          {field.label}
        </span>
        <textarea
          value={values[field.name]}
          onChange={(event) => updateField(field.name, event.target.value)}
          rows={field.rows ?? 4}
          placeholder={field.placeholder}
          className="tw-form-textarea tw-block tw-w-full tw-resize-y tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-py-2.5 tw-text-sm tw-leading-6 tw-text-iron-50 tw-ring-1 tw-ring-inset tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400"
        />
      </label>
    );
  };

  if (!canUseDOM || !isOpen || !currentStep) {
    return null;
  }

  return createPortal(
    <>
      <dialog
        open
        aria-modal="true"
        aria-labelledby="quorum-proposal-title"
        className="tailwind-scope tw-fixed tw-inset-0 tw-z-[1000] tw-m-0 tw-h-full tw-w-full tw-max-w-none tw-border-0 tw-bg-gray-600/50 tw-p-0 tw-outline-none tw-backdrop-blur-[1px]"
        data-testid="quorum-proposal-modal"
      >
        <button
          type="button"
          onClick={onClose}
          className="tw-fixed tw-inset-0 tw-cursor-default tw-border-0 tw-bg-transparent tw-p-0"
          aria-label="Close QUORUM proposal modal"
          tabIndex={-1}
        />
        <div className="tw-relative tw-z-10 tw-flex tw-h-full tw-items-start tw-justify-center tw-px-4 tw-pb-4 tw-pt-[calc(env(safe-area-inset-top,0px)+1rem)] lg:tw-items-center">
          <div
            ref={panelRef}
            className="tw-max-h-[92vh] tw-w-full tw-max-w-4xl tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-shadow-2xl"
            data-testid="quorum-proposal-modal-panel"
            tabIndex={-1}
          >
            <div className="tw-flex tw-items-start tw-justify-between tw-gap-4 tw-border-b tw-border-solid tw-border-iron-800 tw-p-5 sm:tw-p-6">
              <div>
                <p className="tw-mb-1 tw-text-xs tw-font-semibold tw-uppercase tw-text-primary-300">
                  QUORUM
                </p>
                <h2
                  id="quorum-proposal-title"
                  ref={titleRef}
                  className="tw-mb-0 tw-text-2xl tw-font-bold tw-text-white"
                  tabIndex={-1}
                >
                  Create Proposal
                </h2>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="tw-flex tw-size-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-iron-100"
                aria-label="Close modal"
              >
                <XMarkIcon className="tw-size-6 tw-flex-shrink-0" />
              </button>
            </div>

            <div className="tw-max-h-[calc(92vh-91px)] tw-overflow-y-auto tw-p-5 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300 sm:tw-p-6">
              <CreateDropReplyingWrapper
                activeDrop={activeDrop}
                submitting={submitting}
                onCancelReplyQuote={onCancelReplyQuote}
                dropId={dropId}
              />

              <div className="tw-mb-5 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/60 tw-p-4">
                <p className="tw-mb-0 tw-text-sm tw-leading-6 tw-text-iron-300">
                  QUORUM validates proposals that are ready for implementation.
                  Once a proposal reaches the required votes, it can move into
                  production planning without a second vote.
                </p>
              </div>

              <div className="tw-mb-4 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
                <div>
                  <p className="tw-mb-1 tw-text-xs tw-font-semibold tw-text-iron-500">
                    Step {currentStepIndex + 1} of{" "}
                    {QUORUM_PROPOSAL_STEPS.length}
                  </p>
                  <h3 className="tw-mb-1 tw-text-lg tw-font-semibold tw-text-iron-100">
                    {currentStep.title}
                  </h3>
                  <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
                    {currentStep.description}
                  </p>
                </div>
              </div>

              <div className="tw-grid tw-gap-4">
                {currentStep.fields.map(renderField)}
              </div>

              {isLastStep && (
                <div className="tw-mt-5">
                  <h3 className="tw-mb-2 tw-text-base tw-font-semibold tw-text-iron-100">
                    Markdown Preview
                  </h3>
                  <pre className="tw-max-h-72 tw-overflow-auto tw-whitespace-pre-wrap tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-p-4 tw-text-xs tw-leading-5 tw-text-iron-200">
                    {proposalMarkdown}
                  </pre>
                </div>
              )}

              {showValidation && !hasProposalContent && (
                <p className="tw-mb-0 tw-mt-4 tw-text-sm tw-font-medium tw-text-error">
                  Add at least one proposal field before submitting.
                </p>
              )}

              <div className="tw-mt-6 tw-flex tw-flex-col-reverse tw-gap-3 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentStepIndex((current) => Math.max(0, current - 1))
                  }
                  disabled={currentStepIndex === 0 || submitting}
                  className="tw-inline-flex tw-h-10 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-transparent tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-200 tw-transition disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-border-iron-500 desktop-hover:hover:tw-text-white"
                >
                  Back
                </button>

                {isLastStep ? (
                  <PrimaryButton
                    onClicked={onSubmitClick}
                    loading={submitting}
                    disabled={submitting || !hasProposalContent}
                    padding="tw-px-5 tw-py-2.5"
                  >
                    <span>Submit Proposal</span>
                  </PrimaryButton>
                ) : (
                  <PrimaryButton
                    onClicked={() =>
                      setCurrentStepIndex((current) =>
                        Math.min(QUORUM_PROPOSAL_STEPS.length - 1, current + 1)
                      )
                    }
                    loading={false}
                    disabled={submitting}
                    padding="tw-px-5 tw-py-2.5"
                  >
                    <span>Next</span>
                  </PrimaryButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </dialog>
      <TermsSignatureFlow enabled={termsSignatureFlowEnabled} />
    </>,
    document.body
  );
}
