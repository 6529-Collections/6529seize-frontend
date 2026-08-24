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
        <SpinnerLoader text={label} />
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
          <h2 className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-iron-50">
            {title}
          </h2>
          <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
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
    <section className="tw-relative tw-overflow-hidden tw-rounded-[2rem] tw-border tw-border-solid tw-border-white/10 tw-bg-black">
      <div
        aria-hidden
        className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_62%)]"
      />
      <div
        aria-hidden
        className="tw-pointer-events-none tw-absolute tw-left-1/2 tw-top-1/2 tw-h-80 tw-w-80 -tw-translate-x-1/2 -tw-translate-y-1/2 tw-rounded-full tw-bg-white/5 tw-blur-3xl"
      />

      <div className="tw-relative tw-flex tw-min-h-[240px] tw-flex-col tw-items-center tw-justify-center tw-px-4 tw-py-10 tw-text-center sm:tw-min-h-[360px] sm:tw-px-8 sm:tw-py-16">
        <div className="tw-flex tw-h-14 tw-w-14 tw-items-center tw-justify-center tw-rounded-2xl tw-border tw-border-solid tw-border-white/10 tw-bg-white/5 tw-shadow-[0_18px_60px_rgba(255,255,255,0.08)] sm:tw-h-20 sm:tw-w-20 sm:tw-rounded-[1.75rem]">
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
          <h2 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-100 md:tw-text-xl">
            {title}
          </h2>
          <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-font-normal tw-leading-relaxed tw-text-iron-500 md:tw-mt-3">
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
  profileCurationLabel,
  canManageOwnOfficialWave,
  manageCurationControl,
  onOpenWave,
  onAddPost,
}: {
  readonly waveName: string;
  readonly metadataLabel: string;
  readonly profileCurationLabel?: string | null | undefined;
  readonly canManageOwnOfficialWave: boolean;
  readonly manageCurationControl?: ReactNode | undefined;
  readonly onOpenWave: () => void;
  readonly onAddPost?: (() => void) | undefined;
}) {
  const locale = useBrowserLocale();

  return (
    <div className="tw-grid tw-grid-cols-1 tw-items-start tw-gap-3 md:tw-grid-cols-[minmax(0,1fr)_auto] md:tw-gap-x-4 md:tw-gap-y-2">
      <div className="tw-min-w-0 tw-max-w-2xl md:tw-col-start-1 md:tw-row-start-1">
        <div className="tw-flex tw-items-center">
          <h2 className="tw-m-0 tw-min-w-0 tw-max-w-full tw-text-xl tw-font-semibold tw-text-iron-100">
            {profileCurationLabel ??
              t(locale, "profileCuration.header.fallbackTitle")}
          </h2>
        </div>
      </div>

      <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-text-sm tw-leading-6 md:tw-col-start-1 md:tw-row-start-2">
        <button
          type="button"
          onClick={onOpenWave}
          aria-label={t(locale, "profileCuration.header.openSourceAria", {
            waveName,
          })}
          className="tw-group tw-inline-flex tw-min-w-0 tw-items-center tw-gap-1.5 tw-rounded-md tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-text-iron-400 tw-transition focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-300 desktop-hover:hover:tw-text-iron-200"
        >
          <span className="tw-flex-shrink-0 tw-text-iron-500">
            {t(locale, "profileCuration.header.source")}
          </span>
          <span className="tw-min-w-0 tw-truncate tw-text-iron-300">
            {waveName}
          </span>
          <ArrowTopRightOnSquareIcon className="tw-size-3.5 tw-flex-shrink-0 tw-text-iron-400 tw-transition-colors group-focus-visible:tw-text-primary-300 desktop-hover:group-hover:tw-text-primary-300" />
        </button>
        <span className="tw-text-iron-600">•</span>
        <span className="tw-text-iron-500">{metadataLabel}</span>
      </div>

      {canManageOwnOfficialWave && (
        <div className="tw-flex tw-items-center tw-gap-2 md:tw-col-start-2 md:tw-row-span-2 md:tw-row-start-1 md:tw-justify-end">
          {manageCurationControl}
          {onAddPost !== undefined && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAddPost}
            >
              <PlusIcon className="-tw-ml-1 tw-h-4 tw-w-4 tw-flex-shrink-0" />
              <span>Add post</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
