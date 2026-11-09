"use client";

import Button from "@/components/utils/button/Button";
import { faSignature } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { isSignedMessagesEnabled } from "@/lib/device-signing/feature";
import {
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useId } from "react";
import { useDeviceSecurityState } from "./DeviceSecurityStatus";
import { openDeviceSetup } from "./deviceSetup";
import SignedMessagesEnableStatus from "./SignedMessagesEnableStatus";
import {
  useSignedMessagesNotice,
  type SignedMessagesNoticeModel,
} from "./useSignedMessagesNotice";

interface NoticeCopy {
  readonly title: string;
  readonly body: string | null;
  readonly action: string;
}

function getNoticeCopy(
  locale: SupportedLocale,
  model: SignedMessagesNoticeModel
): NoticeCopy {
  switch (model.kind) {
    case "new-device":
      return {
        title: t(locale, "signedMessages.notice.newDevice.message", {
          label: model.grant.device_label,
        }),
        body: null,
        action: t(locale, "signedMessages.notice.newDevice.revoke"),
      };
    case "renew":
      return {
        title: t(locale, "signedMessages.notice.renew.title", {
          date: formatDate(locale, model.expiresAt),
        }),
        body: t(locale, "signedMessages.notice.renew.body"),
        action: t(locale, "signedMessages.notice.renew.action"),
      };
    case "expired":
      return {
        title: t(locale, "signedMessages.notice.expired.title"),
        body: t(locale, "signedMessages.notice.expired.body"),
        action: t(locale, "signedMessages.notice.renew.action"),
      };
    case "enable":
      return {
        title: t(locale, "signedMessages.notice.enable.title"),
        body: t(locale, "signedMessages.notice.enable.body"),
        action: t(locale, "signedMessages.notice.enable.action"),
      };
    case "restore":
      return {
        title: t(locale, "signedMessages.notice.restore.title"),
        body: t(locale, "signedMessages.notice.restore.body"),
        action: t(locale, "signedMessages.notice.restore.action"),
      };
  }
}

interface SignedMessagesNoticeProps {
  /** Enable and renewal prompts only show while the composer is empty. */
  readonly composerEmpty: boolean;
  readonly hideRenewal?: boolean;
}

function SignedMessagesNoticeContent({
  composerEmpty,
  hideRenewal,
}: SignedMessagesNoticeProps) {
  const locale = useBrowserLocale();
  const titleId = useId();
  const { canEnableEncryption } = useDeviceSecurityState();
  const {
    model,
    canEnable,
    enable,
    enableStatus,
    reconnect,
    isEnabling,
    dismiss,
    acknowledge,
    isAcknowledging,
    revoke,
    isRevoking,
  } = useSignedMessagesNotice({ composerEmpty });

  if (!model || (hideRenewal && model.kind === "renew")) {
    return null;
  }
  const isAlert = model.kind === "new-device";
  if (!isAlert && !canEnable) {
    return null;
  }
  const copy = getNoticeCopy(locale, model);
  const iconClass = "tw-col-start-1 tw-row-start-1 tw-size-5 tw-shrink-0";
  const onAction = () => {
    if (model.kind === "new-device") {
      void revoke(model.grant);
      return;
    }
    if (
      model.kind === "enable" ||
      model.kind === "expired" ||
      model.kind === "restore"
    ) {
      openDeviceSetup(canEnableEncryption ? "both" : "posts");
      return;
    }
    enable("renew");
  };

  return (
    <section
      aria-labelledby={titleId}
      data-testid="signed-messages-notice"
      className={`tw-mb-2 tw-grid tw-grid-cols-[1.25rem_minmax(0,1fr)_auto] tw-items-center tw-gap-x-2 tw-gap-y-1 tw-rounded-lg tw-border tw-border-solid tw-px-2 tw-py-2 sm:tw-px-2.5 ${
        isAlert
          ? "tw-border-amber-500/25 tw-bg-amber-500/5"
          : "tw-border-white/10 tw-bg-iron-950"
      }`}
    >
      {isAlert ? (
        <ExclamationTriangleIcon
          aria-hidden="true"
          className={`${iconClass} tw-text-amber-300`}
        />
      ) : (
        <FontAwesomeIcon
          icon={faSignature}
          aria-hidden="true"
          className={`${iconClass} tw-text-iron-400`}
        />
      )}
      <div className="tw-contents">
        <p
          id={titleId}
          className={`tw-col-start-2 tw-row-start-1 tw-m-0 tw-min-w-0 tw-break-words tw-text-sm tw-font-semibold tw-text-iron-100 ${
            isAlert ? "tw-col-span-2 sm:tw-col-span-1" : ""
          }`}
        >
          {copy.title}
        </p>
        {copy.body && (
          <p className="tw-col-span-3 tw-col-start-1 tw-row-start-2 tw-m-0 tw-text-pretty tw-text-xs tw-leading-5 tw-text-iron-400 sm:tw-col-span-2 sm:tw-col-start-2">
            {copy.body}
          </p>
        )}
        {!isAlert && (
          <SignedMessagesEnableStatus
            status={enableStatus}
            onReconnect={reconnect}
            className="tw-col-span-2 tw-col-start-2 tw-mt-1"
          />
        )}
      </div>
      <div
        className={`tw-items-center tw-gap-1 ${
          isAlert
            ? "tw-col-span-2 tw-col-start-2 tw-row-start-2 tw-grid tw-w-fit tw-max-w-full tw-grid-cols-2 sm:tw-col-span-1 sm:tw-col-start-3 sm:tw-row-start-1"
            : "tw-col-start-3 tw-row-start-1 tw-flex tw-flex-wrap"
        }`}
      >
        {model.kind === "new-device" && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void acknowledge(model.grant)}
            loading={isAcknowledging}
            disabled={isRevoking}
          >
            {t(locale, "signedMessages.notice.newDevice.acknowledge")}
          </Button>
        )}
        <Button
          size="sm"
          variant="secondary"
          onClick={onAction}
          loading={isAlert ? isRevoking : isEnabling}
          disabled={isAlert && isAcknowledging}
        >
          {copy.action}
        </Button>
        {!isAlert && (
          <button
            type="button"
            onClick={dismiss}
            aria-label={t(locale, "signedMessages.notice.dismiss")}
            className="tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-100"
          >
            <XMarkIcon aria-hidden="true" className="tw-size-5" />
          </button>
        )}
      </div>
    </section>
  );
}

/**
 * One non-modal signed-messages notice near the wave composer. Nothing (not
 * even its hooks) runs while the feature flag is off.
 */
export default function SignedMessagesNotice(props: SignedMessagesNoticeProps) {
  if (!isSignedMessagesEnabled()) {
    return null;
  }
  return <SignedMessagesNoticeContent {...props} />;
}
