"use client";

import { useAuth } from "@/components/auth/Auth";
import Button from "@/components/utils/button/Button";
import { useDeviceSigningPrewarm } from "@/hooks/device-signing/useDeviceSigningPrewarm";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  getActiveSigningDecisionHost,
  getCurrentSigningDecision,
  registerSigningDecisionHost,
  resolveSigningDecision,
  subscribeToSigningDecisions,
  type PendingSigningDecision,
  type SignedWriteAction,
  type SigningFailureReason,
} from "@/lib/device-signing/signing-decision";
import {
  Description,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import {
  useCallback,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
} from "react";

const TITLE_KEYS = {
  post: "signedMessages.prompt.title.post",
  edit: "signedMessages.prompt.title.edit",
  delete: "signedMessages.prompt.title.delete",
  react: "signedMessages.prompt.title.react",
} as const satisfies Record<SignedWriteAction, string>;

const UNSIGNED_KEYS = {
  post: "signedMessages.prompt.sendUnsigned",
  edit: "signedMessages.prompt.saveUnsigned",
  delete: "signedMessages.prompt.doUnsigned",
  react: "signedMessages.prompt.doUnsigned",
} as const satisfies Record<SignedWriteAction, string>;

type ReasonGroup = "failed" | "rejected" | "grantUnusable";

const BODY_KEYS = {
  failed: "signedMessages.prompt.failed",
  rejected: "signedMessages.prompt.rejected",
  grantUnusable: "signedMessages.prompt.grantUnusable",
} as const satisfies Record<ReasonGroup, string>;

const SHORT_BODY_KEYS = {
  failed: "signedMessages.prompt.failedShort",
  rejected: "signedMessages.prompt.rejectedShort",
  grantUnusable: "signedMessages.prompt.grantUnusableShort",
} as const satisfies Record<ReasonGroup, string>;

const getReasonGroup = (reason: SigningFailureReason): ReasonGroup => {
  if (reason === "grant-unusable") {
    return "grantUnusable";
  }
  return reason === "rejected" || reason === "unsupported"
    ? "rejected"
    : "failed";
};

/** Posts and edits get a dialog; deletes and reactions a compact prompt. */
const isCompactAction = (action: SignedWriteAction): boolean =>
  action === "delete" || action === "react";

type EnableState = "idle" | "enabling" | "failed";

/**
 * "Turn on signed messages" for a grant that can no longer sign: one wallet
 * signature, then the write is signed again. The prompt hides while the
 * wallet is asked, so wallet dialogs stay usable.
 */
function useEnableThenRetry(id: number) {
  const { requestSignedMessagesGrant } = useAuth();
  const [state, setState] = useState<EnableState>("idle");
  const enable = useCallback(async () => {
    if (!requestSignedMessagesGrant) {
      return;
    }
    setState("enabling");
    try {
      const { success } = await requestSignedMessagesGrant();
      if (success) {
        resolveSigningDecision(id, "retry");
        return;
      }
    } catch {
      // Shown below; sign-in reports its own failures as well.
    }
    setState("failed");
  }, [id, requestSignedMessagesGrant]);
  return {
    canEnable: requestSignedMessagesGrant !== undefined,
    enable,
    state,
  };
}

interface PromptProps {
  readonly locale: SupportedLocale;
  readonly request: PendingSigningDecision;
}

function PromptActions({
  locale,
  request,
  enableThenRetry,
  compact,
}: PromptProps & {
  readonly enableThenRetry: ReturnType<typeof useEnableThenRetry>;
  readonly compact: boolean;
}) {
  const grantUnusable = request.reason === "grant-unusable";
  // Without "Turn on signed messages", sending unsigned is the only way on.
  const unsignedIsDefault = grantUnusable && !enableThenRetry.canEnable;
  const size = compact ? "sm" : "md";
  return (
    <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-2">
      {compact && (
        <Button
          size={size}
          variant="tertiary"
          onClick={() => resolveSigningDecision(request.id, "cancel")}
        >
          {t(locale, "signedMessages.prompt.cancel")}
        </Button>
      )}
      <Button
        size={size}
        variant="secondary"
        data-autofocus={unsignedIsDefault ? true : undefined}
        onClick={() => resolveSigningDecision(request.id, "unsigned")}
      >
        {t(locale, UNSIGNED_KEYS[request.action])}
      </Button>
      {grantUnusable ? (
        enableThenRetry.canEnable && (
          <Button
            size={size}
            variant="primary"
            data-autofocus
            onClick={() => void enableThenRetry.enable()}
          >
            {t(locale, "signedMessages.prompt.enable")}
          </Button>
        )
      ) : (
        <Button
          size={size}
          variant="primary"
          data-autofocus
          onClick={() => resolveSigningDecision(request.id, "retry")}
        >
          {t(locale, "signedMessages.prompt.retry")}
        </Button>
      )}
    </div>
  );
}

function EnableFailedMessage({
  locale,
  state,
}: {
  readonly locale: SupportedLocale;
  readonly state: EnableState;
}) {
  if (state !== "failed") {
    return null;
  }
  return (
    <p role="alert" className="tw-m-0 tw-text-sm tw-text-iron-300">
      {t(locale, "signedMessages.prompt.enableFailed")}
    </p>
  );
}

/**
 * Asks for an explicit choice in an alert dialog (nested correctly when the
 * write started from another dialog, such as the delete confirmation).
 * Posts and edits get a full dialog with no dismiss action on purpose: the
 * pending write continues only by trying again or by sending it unsigned.
 * Deletes and reactions get a small prompt that Cancel or Escape dismisses.
 */
function SigningDecisionPrompt({ locale, request }: PromptProps) {
  const enableThenRetry = useEnableThenRetry(request.id);
  const reasonGroup = getReasonGroup(request.reason);
  const compact = isCompactAction(request.action);
  return (
    <Dialog
      open={enableThenRetry.state !== "enabling"}
      role="alertdialog"
      onClose={() => {
        if (compact) {
          resolveSigningDecision(request.id, "cancel");
        }
      }}
      // Above every dialog a signed write can start from (the delete
      // confirmation, the touch drop menu, the single-drop view, the wave
      // guidelines and preview shells), so their backdrops never cover it.
      className="tailwind-scope tw-relative tw-z-[1000002]"
    >
      <DialogBackdrop
        className={`tw-fixed tw-inset-0 ${compact ? "tw-bg-iron-950/40" : "tw-bg-iron-950/80"}`}
      />
      <div className="tw-fixed tw-inset-0 tw-overflow-y-auto tw-p-4">
        <div
          className={`tw-flex tw-min-h-full tw-justify-center ${compact ? "tw-items-end" : "tw-items-end sm:tw-items-center"}`}
        >
          <DialogPanel
            className={`tw-w-full tw-rounded-xl tw-border tw-border-solid tw-shadow-2xl ${
              compact
                ? "tw-max-w-sm tw-border-iron-700 tw-bg-iron-900 tw-p-4"
                : "tw-max-w-md tw-border-iron-800 tw-bg-iron-950 tw-p-5 sm:tw-p-6"
            }`}
          >
            <DialogTitle
              className={`tw-m-0 tw-flex tw-items-center tw-gap-2 tw-font-semibold tw-text-iron-50 ${compact ? "tw-text-sm" : "tw-text-lg"}`}
            >
              <ExclamationTriangleIcon
                aria-hidden="true"
                className={`tw-flex-shrink-0 tw-text-iron-300 ${compact ? "tw-size-4" : "tw-size-5"}`}
              />
              <span>{t(locale, TITLE_KEYS[request.action])}</span>
            </DialogTitle>
            <Description
              className={`tw-mb-0 tw-text-sm tw-text-iron-300 ${compact ? "tw-mt-1" : "tw-mt-2"}`}
            >
              {t(
                locale,
                compact ? SHORT_BODY_KEYS[reasonGroup] : BODY_KEYS[reasonGroup]
              )}
            </Description>
            <div
              className={`tw-flex tw-flex-col ${compact ? "tw-mt-3 tw-gap-2" : "tw-mt-5 tw-gap-3"}`}
            >
              <EnableFailedMessage
                locale={locale}
                state={enableThenRetry.state}
              />
              <PromptActions
                locale={locale}
                request={request}
                enableThenRetry={enableThenRetry}
                compact={compact}
              />
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}

/**
 * Shows the "Couldn't sign this …" prompts for writes waiting on a signing
 * decision, one at a time, and warms the device key while the app is open.
 * Mounted once, inside Auth, while signed messages are on.
 */
export default function SignedWriteDecisionHost() {
  const locale = useBrowserLocale();
  const hostId = useId();
  useDeviceSigningPrewarm();
  useEffect(() => registerSigningDecisionHost(hostId), [hostId]);
  const activeHostId = useSyncExternalStore(
    subscribeToSigningDecisions,
    getActiveSigningDecisionHost,
    () => null
  );
  const request = useSyncExternalStore(
    subscribeToSigningDecisions,
    getCurrentSigningDecision,
    () => null
  );
  // Only the first mounted host shows prompts.
  if (activeHostId !== hostId || !request) {
    return null;
  }
  return (
    <SigningDecisionPrompt key={request.id} locale={locale} request={request} />
  );
}
