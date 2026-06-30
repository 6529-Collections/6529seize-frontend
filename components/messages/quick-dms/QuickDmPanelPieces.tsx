"use client";

import WavePicture from "@/components/waves/WavePicture";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import type React from "react";
import type { QuickDmAvatarSource } from "./QuickDirectMessagesUtils";

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
    className="tw-relative tw-inline-flex tw-size-8 tw-appearance-none tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-300 tw-transition hover:tw-bg-white/10 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
  >
    {children}
    {hasUnreadIndicator && (
      <span
        className="tw-absolute tw-right-1 tw-top-1 tw-size-2.5 tw-rounded-full tw-bg-red tw-ring-2 tw-ring-iron-950"
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
  onOpenAll,
}: {
  readonly avatar?: React.ReactNode;
  readonly hasBackUnreadIndicator?: boolean;
  readonly locale: SupportedLocale;
  readonly openAllHref?: string | undefined;
  readonly title: string;
  readonly onBack?: (() => void) | undefined;
  readonly onClose: () => void;
  readonly onOpenAll?: (() => void) | undefined;
}) => (
  <div className="tw-flex tw-h-12 tw-flex-shrink-0 tw-items-center tw-gap-2 tw-border-b tw-border-white/10 tw-px-3">
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
        <ArrowLeftIcon className="tw-size-4" aria-hidden="true" />
      </QuickDmIconButton>
    )}
    {avatar}
    <div className="tw-min-w-0 tw-flex-1">
      <h2 className="tw-truncate tw-text-sm tw-font-semibold tw-text-iron-50">
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
        className="tw-inline-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-lg tw-text-iron-300 tw-transition hover:tw-bg-white/10 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
      >
        <ArrowTopRightOnSquareIcon className="tw-size-4" aria-hidden="true" />
      </Link>
    )}
    <QuickDmIconButton
      label={t(locale, "quickDm.closeAriaLabel")}
      onClick={onClose}
    >
      <XMarkIcon className="tw-size-4" aria-hidden="true" />
    </QuickDmIconButton>
  </div>
);

export const QuickDmHeaderAvatar = ({
  avatar,
}: {
  readonly avatar: QuickDmAvatarSource;
}) => (
  <div className="tw-size-7 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-full tw-ring-1 tw-ring-white/15">
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
    <div className="tw-flex tw-flex-col tw-gap-2 tw-p-3" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="tw-flex tw-items-center tw-gap-3 tw-p-2">
          <div className="tw-size-10 tw-rounded-full tw-bg-white/10" />
          <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-2">
            <div className="tw-h-3 tw-w-32 tw-rounded-full tw-bg-white/10" />
            <div className="tw-h-2.5 tw-w-24 tw-rounded-full tw-bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  </>
);
