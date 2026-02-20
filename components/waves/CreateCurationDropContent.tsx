"use client";

import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useDropSignature } from "@/hooks/drops/useDropSignature";
import { selectEditingDropId } from "@/store/editSlice";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import { ActiveDropAction } from "@/types/dropInteractionTypes";
import dynamic from "next/dynamic";
import React, {
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import { AuthContext } from "../auth/Auth";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import { ReactQueryWrapperContext } from "../react-query-wrapper/ReactQueryWrapper";
import { ProcessIncomingDropType } from "@/contexts/wave/hooks/useWaveRealtimeUpdater";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import type { DropMutationBody } from "./CreateDrop";
import CreateDropReplyingWrapper from "./CreateDropReplyingWrapper";
import { CreateDropSubmit } from "./CreateDropSubmit";
import CreateCurationDropUrlInput from "./CreateCurationDropUrlInput";
import type { CurationComposerVariant } from "./PrivilegedDropCreator";
import ModalLayout from "./memes/submission/layout/ModalLayout";
import {
  normalizeCurationDropInput,
  SUPPORTED_CURATION_URL_EXAMPLES,
  validateCurationDropInput,
} from "./utils/validateCurationDropUrl";
import { getOptimisticDrop } from "./utils/getOptimisticDrop";

// Use next/dynamic for lazy loading with SSR support
const TermsSignatureFlow = dynamic(
  () => import("../terms/TermsSignatureFlow"),
  { loading: () => null }
);

interface CreateCurationDropContentProps {
  readonly activeDrop: ActiveDropState | null;
  readonly onCancelReplyQuote: () => void;
  readonly wave: ApiWave;
  readonly dropId: string | null;
  readonly isDropMode: boolean;
  readonly submitDrop: (dropRequest: DropMutationBody) => void;
  readonly curationComposerVariant?: CurationComposerVariant | undefined;
}

const DEFAULT_HELPER_TEXT =
  "Use one supported HTTPS URL only, without extra text.";

interface CurationInfoModalProps {
  readonly isOpen: boolean;
  readonly isApp: boolean;
  readonly title: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
}

const CurationInfoModal: React.FC<CurationInfoModalProps> = ({
  isOpen,
  isApp,
  title,
  onClose,
  children,
}) => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    previousActiveElementRef.current = document.activeElement as HTMLElement;
    modalRef.current?.focus();

    const originalOverflow = document.body.style.overflow;
    if (!isApp) {
      document.body.style.overflow = "hidden";
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      if (!isApp) {
        document.body.style.overflow = originalOverflow;
      }
      document.removeEventListener("keydown", onKeyDown);
      previousActiveElementRef.current?.focus();
    };
  }, [isApp, isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const modalContent = (
    <dialog
      className="tailwind-scope tw-fixed tw-inset-0 tw-z-50 tw-m-0 tw-h-full tw-w-full tw-max-w-none tw-border-0 tw-bg-iron-600/60 tw-p-0 tw-outline-none"
      open
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        className="tw-fixed tw-inset-0 tw-cursor-default tw-border-0 tw-bg-transparent tw-p-0"
        aria-label={`Close ${title}`}
        onClick={onClose}
      />
      <div
        ref={modalRef}
        className="tw-z-10 tw-w-full tw-max-w-2xl tw-px-4"
        tabIndex={-1}
      >
        <ModalLayout title={title} onCancel={onClose}>
          {children}
        </ModalLayout>
      </div>
    </dialog>
  );

  if (isApp) {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
};

const CreateCurationDropContent: React.FC<CreateCurationDropContentProps> = ({
  activeDrop,
  onCancelReplyQuote,
  wave,
  dropId,
  isDropMode,
  submitDrop,
  curationComposerVariant = "default",
}) => {
  const { isApp } = useDeviceInfo();
  const editingDropId = useSelector(selectEditingDropId);
  const { isSafeWallet, address } = useSeizeConnectContext();
  const { requestAuth, setToast, connectedProfile } = useContext(AuthContext);
  const { addOptimisticDrop } = useContext(ReactQueryWrapperContext);
  const { processIncomingDrop } = useMyStream();
  const { signDrop } = useDropSignature();

  const [urlValue, setUrlValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showLiveValidation, setShowLiveValidation] = useState(false);
  const [isSupportedUrlsModalOpen, setIsSupportedUrlsModalOpen] =
    useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isInitialMountRef = useRef(true);
  const isLeaderboardVariant = curationComposerVariant === "leaderboard";

  const curationValidation = useMemo(() => {
    return validateCurationDropInput(urlValue);
  }, [urlValue]);

  const normalizedCurationUrl = useMemo(() => {
    return normalizeCurationDropInput(urlValue);
  }, [urlValue]);

  const canSubmit = !!normalizedCurationUrl && !submitting;
  const isInvalid = showLiveValidation && !!curationValidation;
  const invalidHelperText =
    curationValidation?.helperText ?? DEFAULT_HELPER_TEXT;
  const helperText = isInvalid ? invalidHelperText : DEFAULT_HELPER_TEXT;
  const showSupportedUrlAttention =
    isLeaderboardVariant && isInvalid && urlValue.trim().length > 0;

  const getUpdatedDropRequest = useCallback(
    async (
      requestBody: ApiCreateDropRequest
    ): Promise<ApiCreateDropRequest | null> => {
      if (requestBody.drop_type === ApiDropType.Chat) {
        return requestBody;
      }
      if (!wave.participation.signature_required) {
        return requestBody;
      }

      // Use direct signature if there are no terms to display
      if (!wave.participation.terms) {
        const { success, signature } = await signDrop({
          drop: requestBody,
          termsOfService: null,
        });

        if (!success || !signature) {
          return null;
        }

        return {
          ...requestBody,
          signature,
        };
      }

      // For terms that need to be displayed, use the terms flow
      return new Promise<ApiCreateDropRequest | null>((resolve) => {
        const handleSigningComplete = (result: {
          success: boolean;
          signature?: string | undefined;
        }) => {
          if (!result.success || !result.signature) {
            resolve(null);
            return;
          }

          resolve({
            ...requestBody,
            signature: result.signature,
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

  const submitCurationDrop = useCallback(async () => {
    if (submitting) {
      return;
    }

    const normalizedUrl = normalizeCurationDropInput(urlValue);
    if (!normalizedUrl) {
      setShowLiveValidation(true);
      return;
    }

    setSubmitting(true);

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
        drop_type: isDropMode ? ApiDropType.Participatory : ApiDropType.Chat,
        title: null,
        parts: [
          {
            content: normalizedUrl,
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
        isDropMode ? ApiDropType.Participatory : ApiDropType.Chat
      );

      if (optimisticDrop) {
        void addOptimisticDrop({ drop: optimisticDrop });
        setTimeout(
          () =>
            processIncomingDrop(
              optimisticDrop,
              ProcessIncomingDropType.DROP_INSERT
            ),
          0
        );
      }

      (document.activeElement as HTMLElement).blur();
      if (isApp) {
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
      }

      setUrlValue("");
      setShowLiveValidation(false);

      submitDrop({
        drop: updatedDropRequest,
        dropId: optimisticDrop?.id ?? null,
      });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : String(error),
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }, [
    submitting,
    urlValue,
    requestAuth,
    activeDrop,
    wave,
    isDropMode,
    isSafeWallet,
    address,
    connectedProfile,
    getUpdatedDropRequest,
    addOptimisticDrop,
    processIncomingDrop,
    isApp,
    submitDrop,
    setToast,
  ]);

  const onDrop = useCallback(() => {
    void submitCurationDrop();
  }, [submitCurationDrop]);

  // Clear active reply/quote when entering edit mode on mobile
  useEffect(() => {
    if (isApp && editingDropId && activeDrop) {
      onCancelReplyQuote();
    }
  }, [isApp, editingDropId, activeDrop, onCancelReplyQuote]);

  useEffect(() => {
    if (!activeDrop) {
      return;
    }

    // Skip auto-focus on initial mount in app to prevent keyboard from opening
    if (isApp && isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    isInitialMountRef.current = false;

    const timer = setTimeout(
      () => inputRef.current?.focus(),
      isApp ? 400 : 100
    );

    return () => clearTimeout(timer);
  }, [activeDrop, isApp]);

  const isChatClosed =
    wave.wave.type === ApiWaveType.Chat && !wave.chat.enabled;

  if (isChatClosed) {
    return (
      <div className="tw-w-full tw-flex-grow tw-rounded-lg tw-bg-iron-900 tw-p-4 tw-text-center tw-text-sm tw-font-medium tw-text-iron-500">
        Wave is closed
      </div>
    );
  }

  return (
    <div className="tw-flex-grow">
      <CreateDropReplyingWrapper
        activeDrop={activeDrop}
        submitting={submitting}
        onCancelReplyQuote={onCancelReplyQuote}
        dropId={dropId}
      />
      {isLeaderboardVariant ? (
        <div className="tw-flex tw-w-full tw-items-start tw-gap-x-2 lg:tw-gap-x-3">
          <div className="tw-min-w-0 tw-flex-grow">
            <CreateCurationDropUrlInput
              ref={inputRef}
              value={urlValue}
              disabled={submitting}
              isInvalid={isInvalid}
              showHelperText={false}
              scrollMarginTopClassName="tw-scroll-mt-24"
              canonicalUrl={null}
              onChange={setUrlValue}
              onBlur={() => setShowLiveValidation(true)}
              onSubmit={onDrop}
            />
            <div className="tw-mt-2 tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2">
              <button
                type="button"
                onClick={() => setIsSupportedUrlsModalOpen(true)}
                className={`tw-border-0 tw-bg-transparent tw-p-0 tw-text-xs tw-font-medium tw-underline tw-transition desktop-hover:hover:tw-text-white ${
                  showSupportedUrlAttention
                    ? "tw-text-red-300 tw-animate-pulse"
                    : "tw-text-iron-300"
                }`}
              >
                Supported URLs
              </button>
              {showSupportedUrlAttention && (
                <p
                  role="alert"
                  className="tw-text-red-300 tw-mb-0 tw-text-xs tw-font-semibold"
                >
                  Unsupported URL format. Open Supported URLs.
                </p>
              )}
              {normalizedCurationUrl &&
                normalizedCurationUrl !== urlValue.trim() && (
                  <p className="tw-mb-0 tw-text-[11px] tw-text-iron-500">
                    Will submit as: {normalizedCurationUrl}
                  </p>
                )}
            </div>
          </div>
          <div className="tw-shrink-0 tw-self-start">
            <CreateDropSubmit
              submitting={submitting}
              canSubmit={canSubmit}
              onDrop={onDrop}
              isDropMode={isDropMode}
            />
          </div>
        </div>
      ) : (
        <div className="tw-flex tw-w-full tw-items-end">
          <div className="tw-flex tw-w-full tw-items-center tw-gap-x-2 lg:tw-gap-x-3">
            <div className="tw-w-full tw-flex-grow">
              <CreateCurationDropUrlInput
                ref={inputRef}
                value={urlValue}
                disabled={submitting}
                isInvalid={isInvalid}
                helperText={helperText}
                canonicalUrl={normalizedCurationUrl}
                onChange={setUrlValue}
                onBlur={() => setShowLiveValidation(true)}
                onSubmit={onDrop}
              />
            </div>
          </div>
          <div className="tw-ml-2 lg:tw-ml-3">
            <div className="tw-flex tw-items-center tw-gap-x-3">
              <CreateDropSubmit
                submitting={submitting}
                canSubmit={canSubmit}
                onDrop={onDrop}
                isDropMode={isDropMode}
              />
            </div>
          </div>
        </div>
      )}
      {isLeaderboardVariant && (
        <>
          <CurationInfoModal
            isOpen={isSupportedUrlsModalOpen}
            onClose={() => setIsSupportedUrlsModalOpen(false)}
            title="Supported URLs"
            isApp={isApp}
          >
            <p className="tw-mb-3 tw-text-sm tw-text-iron-300">
              Submit one URL only. It must match one of these formats:
            </p>
            <ul className="tw-m-0 tw-list-none tw-space-y-2 tw-p-0">
              {SUPPORTED_CURATION_URL_EXAMPLES.map(({ label, example }) => (
                <li key={`${label}-${example}`} className="tw-space-y-1">
                  <p className="tw-mb-0 tw-text-xs tw-font-semibold tw-text-iron-100">
                    {label}
                  </p>
                  <code className="tw-block tw-overflow-x-auto tw-rounded-md tw-bg-iron-900 tw-px-2 tw-py-1 tw-text-[11px] tw-text-iron-300">
                    {example}
                  </code>
                </li>
              ))}
            </ul>
          </CurationInfoModal>
        </>
      )}
      <TermsSignatureFlow />
    </div>
  );
};

export default CreateCurationDropContent;
