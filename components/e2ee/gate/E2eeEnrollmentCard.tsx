"use client";

import {
  ArchiveBoxXMarkIcon,
  EyeSlashIcon,
  FingerPrintIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import {
  type ReactNode,
  useCallback,
  useId,
  useState,
  useSyncExternalStore,
} from "react";
import { useAuth } from "@/components/auth/Auth";
import type { RequestSignedMessagesGrant } from "@/components/auth/authSignedMessagesGrant";
import SignedMessagesEnableStatus from "@/components/device-signing/SignedMessagesEnableStatus";
import { useEnableSignedMessages } from "@/hooks/device-signing/useEnableSignedMessages";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import {
  getDeviceSetupTitleKey,
  type DeviceSetupScope,
} from "@/components/device-signing/deviceSetup";
import { faSignature } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useCapacitor from "@/hooks/useCapacitor";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import type { E2eeEngine } from "@/lib/e2ee/types";
import {
  E2EE_SIGNATURE_REJECTED,
  getE2eeErrorCode,
  isE2eeSignatureRejection,
} from "../e2eeErrors";
import { tCount } from "../e2eeFormat";
import { isSafariBrowser } from "../e2eePlatform";
import { useE2eeUpgradeCount } from "../useE2eeUpgrade";
import { turnOnWithCombinedSignIn } from "./e2eeCombinedTurnOn";

const POINTS: readonly {
  readonly key: MessageKey;
  readonly Icon: typeof ShieldCheckIcon;
}[] = [
  { key: "e2ee.enroll.point.signature", Icon: FingerPrintIcon },
  { key: "e2ee.enroll.point.privacy", Icon: EyeSlashIcon },
  { key: "e2ee.enroll.point.noBackup", Icon: ArchiveBoxXMarkIcon },
];

const SIGN_LABEL = {
  both: "e2ee.enroll.signBoth",
  posts: "e2ee.enroll.signPosts",
  dms: "e2ee.enroll.signDms",
} as const;

function getPermissionPointKey(
  key: MessageKey,
  scope: DeviceSetupScope,
  isNative: boolean
): MessageKey {
  if (key === "e2ee.enroll.point.signature" && scope === "both")
    return "e2ee.enroll.encryptionCombined";
  if (key === "e2ee.enroll.point.noBackup" && isNative)
    return "e2ee.enroll.point.noBackupApp";
  return key;
}

const ENROLL_REJECTED_KEY: MessageKey = "e2ee.enroll.rejected";

const subscribeNever = () => () => undefined;

const getEnrollErrorKey = (error: unknown, upgrading: boolean): MessageKey => {
  if (
    isE2eeSignatureRejection(error) ||
    getE2eeErrorCode(error) === E2EE_SIGNATURE_REJECTED
  ) {
    return ENROLL_REJECTED_KEY;
  }
  return upgrading ? "e2ee.upgrade.failed" : "e2ee.enroll.failed";
};

/** Upgrade copy (D172) replaces first-time copy for encrypted DMs alone. */
const getSignLabelKey = (
  scope: DeviceSetupScope,
  upgrading: boolean
): MessageKey =>
  upgrading && scope === "dms" ? "e2ee.upgrade.sign" : SIGN_LABEL[scope];

function EncryptionIntro({
  upgradeCount,
}: {
  readonly upgradeCount: number | null;
}) {
  const locale = useBrowserLocale();
  if (upgradeCount === null) {
    return (
      <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-5 tw-text-iron-300">
        {t(locale, "e2ee.enroll.intro")}
      </p>
    );
  }
  return (
    <>
      <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-5 tw-text-iron-200">
        {t(locale, "e2ee.upgrade.intro")}
      </p>
      {upgradeCount > 0 ? (
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-5 tw-text-iron-300">
          {tCount(
            locale,
            { one: "e2ee.upgrade.kept.one", other: "e2ee.upgrade.kept.other" },
            upgradeCount
          )}
        </p>
      ) : null}
    </>
  );
}

function SetupPermissionCopy({
  scope,
  isNative,
  upgradeCount,
}: {
  readonly scope: DeviceSetupScope;
  readonly isNative: boolean;
  readonly upgradeCount: number | null;
}) {
  const locale = useBrowserLocale();
  const includesSigning = scope !== "dms";
  const includesEncryption = scope !== "posts";
  const signingCopy = isNative
    ? "e2ee.enroll.signingApp"
    : "signedMessages.notice.enable.body";
  return (
    <>
      {scope === "both" && (
        <p className="tw-mb-3 tw-mt-0 tw-text-sm tw-text-iron-300">
          {t(locale, "e2ee.enroll.oneSignatureBoth")}
        </p>
      )}
      {includesSigning && (
        <>
          <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-50">
            {t(locale, "e2ee.enroll.signingSection")}
          </h3>
          <p className="tw-mt-2 tw-flex tw-items-start tw-gap-3 tw-text-sm tw-leading-5 tw-text-iron-200">
            <FontAwesomeIcon
              icon={faSignature}
              aria-hidden="true"
              className="tw-mt-0.5 tw-size-5 tw-shrink-0 tw-text-iron-400"
            />
            {t(
              locale,
              scope === "both" ? "e2ee.enroll.signingCombined" : signingCopy
            )}
          </p>
        </>
      )}
      {includesEncryption && (
        <>
          {includesSigning && (
            <h3 className="tw-m-0 tw-mt-3 tw-text-sm tw-font-semibold tw-text-iron-50">
              {t(locale, "e2ee.enroll.encryptionSection")}
            </h3>
          )}
          <EncryptionIntro upgradeCount={upgradeCount} />
          <ul className="tw-m-0 tw-mt-3 tw-flex tw-list-none tw-flex-col tw-gap-3 tw-p-0">
            {POINTS.map(({ key, Icon }) => (
              <li key={key} className="tw-flex tw-items-start tw-gap-3">
                <Icon
                  aria-hidden="true"
                  className="tw-mt-0.5 tw-size-5 tw-flex-shrink-0 tw-text-iron-400"
                />
                <span className="tw-text-sm tw-leading-5 tw-text-iron-200">
                  {t(locale, getPermissionPointKey(key, scope, isNative))}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="tw-mb-0 tw-mt-3 tw-flex tw-items-start tw-gap-3 tw-text-sm tw-leading-5 tw-text-iron-200">
        <ShieldCheckIcon
          aria-hidden="true"
          className="tw-mt-0.5 tw-size-5 tw-shrink-0 tw-text-iron-400"
        />
        {t(locale, "e2ee.enroll.point.noFunds")}
      </p>
    </>
  );
}

interface E2eeEnrollmentCardProps {
  readonly scope?: DeviceSetupScope;
  readonly onScopeChange?: (scope: DeviceSetupScope) => void;
  readonly onClose?: () => void;
  readonly engine: E2eeEngine | null;
  readonly enrolling: boolean;
  readonly encryptionLoading?: boolean;
  readonly engineError: string | null;
  /** Extra context under the points (who signs, where to turn it off). */
  readonly details?: ReactNode | undefined;
}

/**
 * First use: explains, in plain words, the single wallet signature, what
 * 6529 can and cannot see, and how to back up encrypted history.
 */
export function E2eeEnrollmentCard({
  scope = "dms",
  onClose,
  onScopeChange,
  engine,
  enrolling,
  encryptionLoading = false,
  engineError,
  details,
}: E2eeEnrollmentCardProps) {
  const locale = useBrowserLocale();
  const { isCapacitor } = useCapacitor();
  const [alternateScope, setAlternateScope] = useState<DeviceSetupScope | null>(
    null
  );
  const selectedScope = alternateScope ?? scope;
  const [offerSeparateSetup, setOfferSeparateSetup] = useState(false);
  const includesEncryption = selectedScope !== "posts";
  const upgradeCount = useE2eeUpgradeCount(engine);
  const upgrading = includesEncryption && upgradeCount !== null;
  const headingId = useId();
  const { requestSignedMessagesGrant } = useAuth();
  const { address } = useSeizeConnectContext();
  const [pending, setPending] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);
  const isSafari = useSyncExternalStore(
    subscribeNever,
    isSafariBrowser,
    () => false
  );
  const requestEnrollment = useCallback<RequestSignedMessagesGrant>(
    async (options) => {
      if (selectedScope === "posts") {
        return (
          requestSignedMessagesGrant?.(options) ?? {
            success: false,
            reason: "unavailable",
          }
        );
      }
      if (!engine) return { success: false, reason: "unavailable" };
      setPending(true);
      setErrorKey(null);
      try {
        if (selectedScope === "dms") {
          await engine.enroll();
          return { success: true };
        }
        const outcome = await turnOnWithCombinedSignIn({
          engine,
          address,
          requestGrant: requestSignedMessagesGrant
            ? (input) =>
                requestSignedMessagesGrant({
                  ...input,
                  onSignatureRequested: options?.onSignatureRequested,
                })
            : undefined,
        });
        switch (outcome) {
          case "declined":
            setErrorKey(ENROLL_REJECTED_KEY);
            return { success: false, reason: "rejected" };
          case "stopped":
            return { success: false, reason: "context-changed" };
          case "partial":
            setAlternateScope("dms");
            onScopeChange?.("dms");
            setErrorKey("e2ee.enroll.combinedPartial");
            return { success: false, reason: "unavailable" };
          case "fallback":
            setOfferSeparateSetup(true);
            setErrorKey("e2ee.enroll.combinedUnavailable");
            return { success: false, reason: "unavailable" };
          case "done":
            return { success: true };
        }
      } catch (error) {
        setErrorKey(getEnrollErrorKey(error, upgrading));
        return {
          success: false,
          reason: isE2eeSignatureRejection(error)
            ? "rejected"
            : "signature-failed",
        };
      } finally {
        setPending(false);
      }
    },
    [
      address,
      engine,
      onScopeChange,
      requestSignedMessagesGrant,
      selectedScope,
      upgrading,
    ]
  );
  const onEnabled = useCallback(() => onClose?.(), [onClose]);
  const flow = useEnableSignedMessages({
    requestGrant: requestEnrollment,
    onEnabled,
  });
  const waiting = pending || enrolling || flow.isEnabling;
  const canSign = includesEncryption
    ? engine?.getStatus() === "needs-enrollment"
    : requestSignedMessagesGrant !== undefined;

  return (
    <section
      aria-labelledby={onClose ? undefined : headingId}
      className={
        onClose
          ? "tw-flex tw-min-h-0 tw-flex-1 tw-flex-col"
          : "tw-mx-auto tw-flex tw-w-full tw-max-w-xl tw-flex-col tw-gap-4 tw-px-4 tw-py-8"
      }
    >
      <div
        className={
          onClose
            ? "tw-flex tw-min-h-0 tw-flex-1 tw-flex-col"
            : "tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5"
        }
      >
        {!onClose && (
          <h2
            id={headingId}
            className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50"
          >
            {t(locale, getDeviceSetupTitleKey(selectedScope, upgrading))}
          </h2>
        )}
        <div
          className={
            onClose
              ? "tw-min-h-0 tw-overflow-y-auto tw-overscroll-contain tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500"
              : undefined
          }
        >
          <SetupPermissionCopy
            scope={selectedScope}
            isNative={isCapacitor}
            upgradeCount={upgrading ? upgradeCount : null}
          />
          {details}
          {isSafari && includesEncryption ? (
            <p className="tw-mb-0 tw-mt-3 tw-rounded-lg tw-bg-amber-500/10 tw-p-3 tw-text-sm tw-leading-5 tw-text-amber-100">
              {t(locale, "e2ee.enroll.safari")}
            </p>
          ) : null}
        </div>
        <div className="tw-mt-4 tw-flex tw-shrink-0 tw-flex-col tw-gap-2">
          <div
            className={
              onClose
                ? "tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row-reverse sm:tw-justify-start"
                : "tw-grid"
            }
          >
            <Button
              variant="action"
              size="lg"
              onClick={() => flow.enable("encrypted-messages")}
              loading={waiting}
              disabled={!canSign}
              aria-busy={waiting || encryptionLoading}
              className="!tw-whitespace-normal tw-text-center"
            >
              {t(locale, getSignLabelKey(selectedScope, upgrading))}
            </Button>
            {onClose && (
              <Button
                variant="secondary"
                size="lg"
                disabled={waiting}
                onClick={onClose}
              >
                {t(locale, "e2ee.action.cancel")}
              </Button>
            )}
          </div>
          {offerSeparateSetup && selectedScope === "both" && !waiting && (
            <div className="tw-flex tw-flex-wrap tw-gap-2">
              {(["posts", "dms"] as const).map((permission) => (
                <Button
                  key={permission}
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setAlternateScope(permission);
                    onScopeChange?.(permission);
                    setErrorKey(null);
                  }}
                >
                  {t(
                    locale,
                    permission === "posts"
                      ? "e2ee.deviceStatus.enableProof"
                      : "e2ee.deviceStatus.enableEncryption"
                  )}
                </Button>
              ))}
            </div>
          )}
          {includesEncryption && !canSign && !waiting && (
            <output className="tw-m-0 tw-text-sm tw-text-iron-300">
              {t(
                locale,
                encryptionLoading ? "e2ee.loading" : "e2ee.enroll.unavailable"
              )}
            </output>
          )}
          <EnrollmentFeedback
            errorKey={errorKey}
            engineError={engineError}
            waiting={waiting}
            flow={flow}
          />
        </div>
      </div>
    </section>
  );
}

function EnrollmentFeedback({
  errorKey,
  engineError,
  waiting,
  flow,
}: {
  readonly errorKey: MessageKey | null;
  readonly engineError: string | null;
  readonly waiting: boolean;
  readonly flow: Pick<
    ReturnType<typeof useEnableSignedMessages>,
    "status" | "reconnect"
  >;
}) {
  const locale = useBrowserLocale();
  const visibleErrorKey =
    errorKey ??
    (!waiting && engineError === E2EE_SIGNATURE_REJECTED
      ? ENROLL_REJECTED_KEY
      : null);
  const declined = visibleErrorKey === ENROLL_REJECTED_KEY;
  const failureKey = declined ? null : visibleErrorKey;
  let statusKey: MessageKey | null = null;
  if (declined) statusKey = ENROLL_REJECTED_KEY;
  else if (waiting && flow.status === null) statusKey = "e2ee.enroll.waiting";

  return (
    <>
      {!visibleErrorKey ? (
        <SignedMessagesEnableStatus
          status={flow.status}
          onReconnect={flow.reconnect}
        />
      ) : null}
      {/* One polite region for waiting and for declining (a choice). */}
      <output
        className={`tw-block tw-text-center tw-text-sm tw-text-iron-300 ${
          statusKey ? "" : "tw-sr-only"
        }`}
      >
        {statusKey ? t(locale, statusKey) : null}
      </output>
      {failureKey ? (
        <p
          role="alert"
          className="tw-m-0 tw-text-center tw-text-sm tw-text-rose-300"
        >
          {t(locale, failureKey)}
        </p>
      ) : null}
    </>
  );
}
