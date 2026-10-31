"use client";

import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { isSignedMessagesEnabled } from "@/lib/device-signing/feature";
import {
  ExclamationTriangleIcon,
  FingerPrintIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useId } from "react";
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
  }
}

interface SignedMessagesNoticeProps {
  /** Enable and renewal prompts only show while the composer is empty. */
  readonly composerEmpty: boolean;
}

function SignedMessagesNoticeContent({
  composerEmpty,
}: SignedMessagesNoticeProps) {
  const locale = useBrowserLocale();
  const titleId = useId();
  const {
    model,
    canEnable,
    enable,
    enableStatus,
    reconnect,
    isEnabling,
    dismiss,
    revoke,
    isRevoking,
  } = useSignedMessagesNotice({ composerEmpty });

  if (!model) {
    return null;
  }
  const isAlert = model.kind === "new-device";
  if (!isAlert && !canEnable) {
    return null;
  }
  const copy = getNoticeCopy(locale, model);
  const Icon = isAlert ? ExclamationTriangleIcon : FingerPrintIcon;
  const onAction = () => {
    if (model.kind === "new-device") {
      void revoke(model.grant);
      return;
    }
    enable(model.kind === "enable" ? "notice" : "renew");
  };

  return (
    <section
      aria-labelledby={titleId}
      data-testid="signed-messages-notice"
      className={`tw-mb-2 tw-flex tw-flex-wrap tw-items-start tw-gap-x-3 tw-gap-y-2 tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-2.5 ${
        isAlert
          ? "tw-border-red/30 tw-bg-red/10"
          : "tw-border-white/10 tw-bg-iron-950"
      }`}
    >
      <Icon
        aria-hidden="true"
        className={`tw-mt-0.5 tw-size-5 tw-flex-shrink-0 ${
          isAlert ? "tw-text-red" : "tw-text-iron-400"
        }`}
      />
      <div className="tw-min-w-0 tw-flex-1 tw-basis-48">
        <p
          id={titleId}
          className="tw-m-0 tw-break-words tw-text-sm tw-font-semibold tw-text-iron-100"
        >
          {copy.title}
        </p>
        {copy.body && (
          <p className="tw-m-0 tw-mt-0.5 tw-text-pretty tw-text-xs tw-leading-5 tw-text-iron-400">
            {copy.body}
          </p>
        )}
        {!isAlert && (
          <SignedMessagesEnableStatus
            status={enableStatus}
            onReconnect={reconnect}
            className="tw-mt-1"
          />
        )}
      </div>
      <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-x-1">
        <Button
          size="sm"
          variant={isAlert ? "destructive" : "secondary"}
          onClick={onAction}
          loading={isAlert ? isRevoking : isEnabling}
        >
          {copy.action}
        </Button>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t(locale, "signedMessages.notice.dismiss")}
          className="tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-100"
        >
          <XMarkIcon aria-hidden="true" className="tw-size-5" />
        </button>
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
