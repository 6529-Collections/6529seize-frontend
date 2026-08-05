"use client";

import WavePicture from "@/components/waves/WavePicture";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  PaperAirplaneIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import type React from "react";
import type { QuickDmAvatarSource } from "./QuickDirectMessagesUtils";

const QUICK_DM_LOADING_ROW_KEYS = ["primary", "secondary", "tertiary"] as const;

const QuickDmIconButton = ({
  hasUnreadIndicator = false,
  label,
  onClick,
  children,
}: {
  readonly hasUnreadIndicator?: boolean;
  readonly label: string;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    className="tw-relative tw-inline-flex tw-size-9 tw-appearance-none tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-white motion-reduce:tw-transition-none"
  >
    {children}
    {hasUnreadIndicator && (
      <span
        className="tw-absolute tw-right-1 tw-top-1 tw-size-2.5 tw-rounded-full tw-bg-red tw-shadow-sm tw-ring-2 tw-ring-iron-900"
        aria-hidden="true"
      />
    )}
  </button>
);

export const QuickDmPanelHeader = ({
  avatar,
  hasBackUnreadIndicator = false,
  locale,
  openAllHref,
  title,
  onBack,
  onClose,
  onCreateDirectMessage,
  onOpenAll,
}: {
  readonly avatar?: React.ReactNode;
  readonly hasBackUnreadIndicator?: boolean;
  readonly locale: SupportedLocale;
  readonly openAllHref?: string | undefined;
  readonly title: string;
  readonly onBack?: (() => void) | undefined;
  readonly onClose: () => void;
  readonly onCreateDirectMessage?: (() => void) | undefined;
  readonly onOpenAll?: (() => void) | undefined;
}) => (
  <div className="tw-flex tw-h-14 tw-flex-shrink-0 tw-items-center tw-gap-2 tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-px-3">
    {onBack && (
      <QuickDmIconButton
        hasUnreadIndicator={hasBackUnreadIndicator}
        label={t(
          locale,
          hasBackUnreadIndicator
            ? "quickDm.backUnreadAriaLabel"
            : "quickDm.backAriaLabel"
        )}
        onClick={onBack}
      >
        <ArrowLeftIcon className="tw-size-[18px]" aria-hidden="true" />
      </QuickDmIconButton>
    )}
    {avatar}
    <div className="tw-min-w-0 tw-flex-1">
      <h2 className="tw-m-0 tw-truncate tw-text-base tw-font-semibold tw-tracking-tight tw-text-iron-50">
        {title}
      </h2>
    </div>
    {onOpenAll && openAllHref && (
      <Link
        href={openAllHref}
        onClick={onOpenAll}
        aria-label={t(locale, "quickDm.openConversationAriaLabel", {
          name: title,
        })}
        title={t(locale, "quickDm.openConversation")}
        className="tw-inline-flex tw-size-9 tw-items-center tw-justify-center tw-rounded-lg tw-text-iron-400 tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-white motion-reduce:tw-transition-none"
      >
        <ArrowTopRightOnSquareIcon
          className="tw-size-[18px]"
          aria-hidden="true"
        />
      </Link>
    )}
    {onCreateDirectMessage && (
      <QuickDmIconButton
        label={t(locale, "quickDm.newDirectMessageAriaLabel")}
        onClick={onCreateDirectMessage}
      >
        <span className="tw-flex tw-size-[18px] tw-items-center tw-justify-center">
          <PaperAirplaneIcon
            className="tw-size-3.5 -tw-rotate-45"
            aria-hidden="true"
          />
        </span>
      </QuickDmIconButton>
    )}
    <QuickDmIconButton
      label={t(locale, "quickDm.closeAriaLabel")}
      onClick={onClose}
    >
      <XMarkIcon className="tw-size-[18px]" aria-hidden="true" />
    </QuickDmIconButton>
  </div>
);

export const QuickDmHeaderAvatar = ({
  avatar,
}: {
  readonly avatar: QuickDmAvatarSource;
}) => (
  <div className="tw-size-8 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-full tw-bg-iron-800 tw-ring-1 tw-ring-white/15">
    <WavePicture
      name={avatar.name}
      picture={avatar.picture}
      contributors={avatar.contributors}
    />
  </div>
);

export const QuickDmLoadingRows = ({
  locale,
}: {
  readonly locale: SupportedLocale;
}) => (
  <>
    <span className="tw-sr-only" role="status" aria-live="polite">
      {t(locale, "quickDm.loadingStatus")}
    </span>
    <div
      className="tw-flex tw-animate-pulse tw-flex-col tw-gap-0.5 tw-p-2 motion-reduce:tw-animate-none"
      aria-hidden="true"
    >
      {QUICK_DM_LOADING_ROW_KEYS.map((rowKey) => (
        <div
          key={rowKey}
          className="tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-px-3 tw-py-3"
        >
          <div className="tw-size-10 tw-rounded-full tw-bg-iron-800" />
          <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-2">
            <div className="tw-h-3 tw-w-32 tw-rounded-full tw-bg-iron-800" />
            <div className="tw-h-2.5 tw-w-24 tw-rounded-full tw-bg-iron-900" />
          </div>
        </div>
      ))}
    </div>
  </>
);
