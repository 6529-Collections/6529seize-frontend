import SpinnerLoader from "@/components/common/SpinnerLoader";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  ArrowTopRightOnSquareIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import type { ReactNode } from "react";

export function LoadingPanel({ label }: { readonly label: string }) {
  return (
    <section aria-label={label}>
      <div className="tw-p-6 sm:tw-p-8">
        <SpinnerLoader
          text={label}
          textClassName="tw-text-meta tw-font-normal tw-text-iron-500"
        />
      </div>
    </section>
  );
}

export function InfoPanel({
  title,
  message,
  actions,
}: {
  readonly title: string;
  readonly message: ReactNode;
  readonly actions?: ReactNode;
}) {
  return (
    <section>
      <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-p-6 tw-text-center sm:tw-p-8">
        <div className="tw-max-w-2xl">
          <h2 className="tw-mb-0 tw-text-md tw-font-semibold tw-text-iron-100">
            {title}
          </h2>
          <p className="tw-mb-0 tw-mt-3 tw-text-md tw-font-normal tw-leading-6 tw-text-iron-300">
            {message}
          </p>
        </div>

        {actions !== undefined && (
          <div className="tw-mt-5 tw-flex tw-flex-wrap tw-justify-center tw-gap-3">
            {actions}
          </div>
        )}
      </div>
    </section>
  );
}

export function CurationEmptyPanel({
  title,
  message,
  primaryAction,
}: {
  readonly title: string;
  readonly message: ReactNode;
  readonly primaryAction?: ReactNode;
}) {
  return (
    <section className="tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-black lg:tw-rounded-[2rem]">
      <div
        aria-hidden
        className="tw-pointer-events-none tw-absolute tw-inset-0 tw-hidden tw-bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_62%)] lg:tw-block"
      />
      <div
        aria-hidden
        className="tw-pointer-events-none tw-absolute tw-left-1/2 tw-top-1/2 tw-hidden tw-h-80 tw-w-80 -tw-translate-x-1/2 -tw-translate-y-1/2 tw-rounded-full tw-bg-white/5 tw-blur-3xl lg:tw-block"
      />

      <div className="tw-relative tw-flex tw-min-h-[240px] tw-flex-col tw-items-center tw-justify-center tw-px-4 tw-py-10 tw-text-center sm:tw-min-h-[360px] sm:tw-px-8 sm:tw-py-16">
        <div className="tw-flex tw-h-14 tw-w-14 tw-items-center tw-justify-center tw-rounded-2xl tw-border tw-border-solid tw-border-white/10 tw-bg-white/5 sm:tw-h-20 sm:tw-w-20 sm:tw-rounded-[1.75rem] lg:tw-shadow-[0_18px_60px_rgba(255,255,255,0.08)]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="tw-h-6 tw-w-6 tw-text-iron-200 sm:tw-h-9 sm:tw-w-9"
          >
            <rect width="7" height="9" x="3" y="3" rx="1" />
            <rect width="7" height="5" x="14" y="3" rx="1" />
            <rect width="7" height="9" x="14" y="12" rx="1" />
            <rect width="7" height="5" x="3" y="16" rx="1" />
          </svg>
        </div>

        <div className="tw-mt-6 tw-max-w-xl md:tw-mt-8">
          <h2 className="tw-mb-0 tw-text-[17px] tw-font-semibold tw-text-iron-400 lg:tw-text-sm lg:tw-font-medium">
            {title}
          </h2>
          <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-font-normal tw-leading-relaxed tw-text-iron-500 md:tw-mt-3 lg:tw-text-meta">
            {message}
          </p>
        </div>

        {primaryAction !== undefined && (
          <div className="tw-mt-6 tw-flex tw-flex-col tw-items-center tw-gap-4 md:tw-mt-8">
            {primaryAction}
          </div>
        )}
      </div>
    </section>
  );
}

export function RetryButton({
  isLoading,
  onClick,
}: {
  readonly isLoading: boolean;
  readonly onClick: () => void;
}) {
  return (
    <Button variant="tertiary" size="sm" onClick={onClick} loading={isLoading}>
      Retry
    </Button>
  );
}

export function OfficialWaveSummary({
  waveName,
  metadataLabel,
  mobileMetadataLabel = metadataLabel,
  profileCurationLabel,
  canManageOwnOfficialWave,
  manageCurationControl,
  onOpenWave,
  onAddPost,
}: {
  readonly waveName: string;
  readonly metadataLabel: string;
  readonly mobileMetadataLabel?: string;
  readonly profileCurationLabel?: string | null | undefined;
  readonly canManageOwnOfficialWave: boolean;
  readonly manageCurationControl?: ReactNode | undefined;
  readonly onOpenWave: () => void;
  readonly onAddPost?: (() => void) | undefined;
}) {
  const locale = useBrowserLocale();
  const hasManageControl =
    canManageOwnOfficialWave && Boolean(manageCurationControl);
  const hasAddPost = canManageOwnOfficialWave && onAddPost !== undefined;

  return (
    <div className="tw-relative tw-grid tw-grid-cols-[minmax(0,1fr)_auto] tw-items-start tw-gap-x-3 tw-gap-y-3 lg:tw-gap-x-6 lg:tw-gap-y-0">
      <h2
        className={`tw-col-span-2 tw-col-start-1 tw-row-start-1 tw-m-0 tw-min-w-0 tw-max-w-full tw-text-lg tw-font-semibold tw-text-iron-100 max-lg:tw-break-words lg:tw-col-span-1 lg:tw-text-xl ${hasManageControl ? "tw-min-h-9 tw-pr-12 lg:tw-min-h-0 lg:tw-pr-0" : ""}`}
      >
        <span className="tw-block tw-min-w-0">
          {profileCurationLabel ??
            t(locale, "profileCuration.header.fallbackTitle")}
        </span>
      </h2>
      {canManageOwnOfficialWave && (
        <div className="tw-contents lg:tw-col-start-2 lg:tw-row-span-2 lg:tw-row-start-1 lg:tw-flex lg:tw-items-center lg:tw-justify-end lg:tw-gap-2 lg:tw-self-center">
          {hasManageControl && (
            <div className="tw-absolute tw-right-0 tw-top-0 lg:tw-static">
              {manageCurationControl}
            </div>
          )}
          {hasAddPost && (
            <div className="tw-col-start-2 tw-row-start-3 tw-self-center">
              <Button
                variant="primary"
                size="sm"
                onClick={onAddPost}
                className="max-lg:tw-text-[13px]"
              >
                <PlusIcon className="-tw-ml-1 tw-h-4 tw-w-4 tw-flex-shrink-0" />
                <span>Add post</span>
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="tw-col-span-2 tw-row-start-2 tw-mt-1 tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-text-meta tw-font-normal tw-leading-6 lg:tw-col-span-1 lg:tw-col-start-1">
        <button
          type="button"
          onClick={onOpenWave}
          title={waveName}
          aria-label={t(locale, "profileCuration.header.openSourceAria", {
            waveName,
          })}
          className="desktop-hover:hover:tw-text-primary-100 tw-group -tw-ml-1 tw-inline-flex tw-min-h-8 tw-min-w-0 tw-max-w-full tw-cursor-pointer tw-items-center tw-gap-1.5 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-1 tw-py-0 tw-text-left tw-text-meta tw-font-normal tw-text-primary-300 tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-white/5"
        >
          <span className="tw-flex-shrink-0 tw-text-iron-500">
            {t(locale, "profileCuration.header.source")}
          </span>
          <span className="tw-min-w-0 tw-truncate tw-font-medium tw-leading-6 tw-no-underline">
            {waveName}
          </span>
          <ArrowTopRightOnSquareIcon
            aria-hidden="true"
            className="tw-hidden tw-size-4 tw-flex-shrink-0 tw-transition-transform tw-duration-150 group-hover:-tw-translate-y-0.5 group-hover:tw-translate-x-0.5 motion-reduce:tw-transform-none lg:tw-block"
          />
        </button>
        <span className="tw-hidden tw-text-iron-600 lg:tw-inline">•</span>
        <span className="tw-hidden tw-tabular-nums tw-text-iron-500 lg:tw-inline">
          {metadataLabel}
        </span>
      </div>
      <div
        className={`tw-row-start-3 tw-min-w-0 tw-self-center tw-text-meta tw-font-normal tw-tabular-nums tw-leading-5 tw-text-iron-500 lg:tw-hidden ${hasAddPost ? "tw-col-start-1" : "tw-col-span-2"}`}
      >
        {mobileMetadataLabel.replaceAll(" • ", "\u00a0•\u00a0")}
      </div>
    </div>
  );
}
