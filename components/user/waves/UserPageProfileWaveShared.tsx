import SpinnerLoader from "@/components/common/SpinnerLoader";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import {
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import type { ReactNode, RefObject } from "react";

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

        <div className="tw-mt-8 tw-max-w-2xl">
          <h2 className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-iron-100">
            {title}
          </h2>
          <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-font-normal tw-leading-relaxed tw-text-iron-500">
            {message}
          </p>
        </div>

        {primaryAction !== undefined && (
          <div className="tw-mt-8 tw-flex tw-flex-col tw-items-center tw-gap-4">
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
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className="tw-inline-flex tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-px-3.5 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-200 tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-400 disabled:tw-cursor-not-allowed disabled:tw-border-white/5 disabled:tw-text-iron-500 desktop-hover:hover:tw-border-iron-700 desktop-hover:hover:tw-bg-iron-900"
    >
      {isLoading ? <CircleLoader /> : "Retry"}
    </button>
  );
}

export function OfficialWaveSummary({
  waveName,
  metadataLabel,
  canManageOwnOfficialWave,
  changeWaveDropdown,
  changeWaveButtonRef,
  isChangeWaveOpen,
  isRemoving,
  onOpenWave,
  onOpenChangeWave,
  onRemoveWave,
}: {
  readonly waveName: string;
  readonly metadataLabel: string;
  readonly canManageOwnOfficialWave: boolean;
  readonly changeWaveDropdown?: ReactNode;
  readonly changeWaveButtonRef?: RefObject<HTMLButtonElement | null>;
  readonly isChangeWaveOpen: boolean;
  readonly isRemoving: boolean;
  readonly onOpenWave: () => void;
  readonly onOpenChangeWave: () => void;
  readonly onRemoveWave: () => void;
}) {
  const actionRowClassName = canManageOwnOfficialWave
    ? "tw-flex tw-w-full tw-items-center tw-gap-1.5 sm:tw-gap-2 md:tw-w-auto md:tw-justify-end lg:tw-gap-3"
    : "tw-hidden lg:tw-flex lg:tw-items-center lg:tw-gap-3";

  return (
    <div className="tw-flex tw-flex-col tw-gap-4 md:tw-flex-row md:tw-items-start md:tw-justify-between">
      <div className="tw-min-w-0 tw-max-w-2xl tw-flex-1">
        <div className="tw-flex tw-items-start">
          <button
            type="button"
            onClick={onOpenWave}
            aria-label={`Open wave ${waveName}`}
            title="Open wave"
            className="-tw-ml-1 tw-inline-flex tw-min-w-0 tw-max-w-full tw-items-center tw-gap-2 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-1 tw-py-1 tw-text-left tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-300 desktop-hover:hover:tw-text-iron-100 lg:tw-hidden"
          >
            <span className="tw-min-w-0 tw-truncate tw-text-xl tw-font-semibold tw-text-iron-100">
              {waveName}
            </span>
            <ArrowTopRightOnSquareIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-iron-100" />
          </button>
          <h2 className="tw-mb-0 tw-hidden tw-min-w-0 tw-max-w-full tw-truncate tw-text-xl tw-font-semibold tw-text-iron-100 lg:tw-block">
            {waveName}
          </h2>
        </div>
        <p className="tw-mb-0 tw-mt-0 tw-text-sm tw-leading-6 tw-text-iron-400">
          {metadataLabel}
        </p>
      </div>

      <div className={actionRowClassName}>
        {canManageOwnOfficialWave && (
          <div className="tw-relative">
            <button
              ref={changeWaveButtonRef}
              type="button"
              onClick={onOpenChangeWave}
              className={`tw-inline-flex tw-items-center tw-justify-between tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-300 sm:tw-px-4 sm:tw-py-2.5 sm:tw-text-sm md:tw-w-auto md:tw-justify-center md:tw-py-2 ${
                isChangeWaveOpen
                  ? "tw-border-white/15 tw-bg-white/10 tw-text-iron-100 tw-shadow-inner"
                  : "tw-border-white/10 tw-bg-white/5 tw-text-iron-100 desktop-hover:hover:tw-border-white/15 desktop-hover:hover:tw-bg-white/10"
              }`}
            >
              <span>Switch wave</span>
              <ChevronDownIcon
                className={`tw-h-4 tw-w-4 tw-flex-shrink-0 tw-transition tw-duration-200 ${
                  isChangeWaveOpen ? "tw-rotate-180" : ""
                }`}
              />
            </button>

            {changeWaveDropdown !== undefined && (
              <div className="tw-absolute tw-right-0 tw-top-full tw-z-20 tw-mt-1 tw-hidden tw-w-56 lg:tw-block">
                {changeWaveDropdown}
              </div>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={onOpenWave}
          className="tw-hidden tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/5 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-300 desktop-hover:hover:tw-border-white/15 desktop-hover:hover:tw-bg-white/10 lg:tw-inline-flex"
        >
          <span>Open wave</span>
          <ArrowTopRightOnSquareIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
        </button>
        {canManageOwnOfficialWave && (
          <button
            type="button"
            onClick={onRemoveWave}
            disabled={isRemoving}
            aria-label="Unset official wave"
            title="Unset official wave"
            className="tw-inline-flex tw-flex-shrink-0 tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-transparent tw-bg-transparent tw-px-2 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-zinc-500 tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-rose-400 disabled:tw-cursor-not-allowed disabled:tw-text-iron-600 desktop-hover:hover:tw-border-rose-500/20 desktop-hover:hover:tw-bg-rose-500/10 desktop-hover:hover:tw-text-rose-400 sm:tw-px-4 sm:tw-py-2 sm:tw-text-sm"
          >
            {isRemoving ? (
              <CircleLoader />
            ) : (
              <XMarkIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0 md:-tw-ml-1.5" />
            )}
            <span>Unset</span>
          </button>
        )}
      </div>
    </div>
  );
}
