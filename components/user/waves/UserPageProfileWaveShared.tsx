import SpinnerLoader from "@/components/common/SpinnerLoader";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import {
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
  PlusIcon,
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
  profileCurationLabel,
  canManageOwnOfficialWave,
  changeWaveDropdown,
  changeCurationDropdown,
  changeWaveDropdownRef,
  changeCurationDropdownRef,
  changeWaveButtonRef,
  changeCurationButtonRef,
  isChangeWaveOpen,
  isChangeCurationOpen = false,
  isRemoving,
  isChangingCuration = false,
  showChangeCuration = false,
  onOpenWave,
  onAddPost,
  onOpenChangeWave,
  onOpenChangeCuration,
  onRemoveWave,
}: {
  readonly waveName: string;
  readonly metadataLabel: string;
  readonly profileCurationLabel?: string | null | undefined;
  readonly canManageOwnOfficialWave: boolean;
  readonly changeWaveDropdown?: ReactNode;
  readonly changeCurationDropdown?: ReactNode;
  readonly changeWaveDropdownRef?: RefObject<HTMLDivElement | null>;
  readonly changeCurationDropdownRef?: RefObject<HTMLDivElement | null>;
  readonly changeWaveButtonRef?: RefObject<HTMLButtonElement | null>;
  readonly changeCurationButtonRef?: RefObject<HTMLButtonElement | null>;
  readonly isChangeWaveOpen: boolean;
  readonly isChangeCurationOpen?: boolean | undefined;
  readonly isRemoving: boolean;
  readonly isChangingCuration?: boolean | undefined;
  readonly showChangeCuration?: boolean | undefined;
  readonly onOpenWave: () => void;
  readonly onAddPost?: (() => void) | undefined;
  readonly onOpenChangeWave: () => void;
  readonly onOpenChangeCuration?: (() => void) | undefined;
  readonly onRemoveWave: () => void;
}) {
  const changeWaveDropdownId =
    changeWaveDropdown === undefined ? undefined : "change-wave-dropdown";
  const changeCurationDropdownId =
    changeCurationDropdown === undefined
      ? undefined
      : "change-curation-dropdown";

  return (
    <div className="tw-grid tw-grid-cols-[minmax(0,1fr)_auto] tw-items-start tw-gap-x-3 tw-gap-y-2 lg:tw-gap-y-0">
      <div className="tw-col-start-1 tw-row-start-1 tw-min-w-0 tw-max-w-2xl">
        <div className="tw-flex tw-items-center">
          <h2 className="tw-mb-0 tw-min-w-0 tw-max-w-full tw-text-xl tw-font-semibold tw-text-iron-100">
            {waveName}
          </h2>
          <button
            type="button"
            onClick={onOpenWave}
            aria-label={`Open wave ${waveName}`}
            title="Open wave"
            className="tw-ml-2 tw-inline-flex tw-h-7 tw-w-7 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/5 tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-300 desktop-hover:hover:tw-border-white/15 desktop-hover:hover:tw-bg-white/10 desktop-hover:hover:tw-text-iron-100"
          >
            <ArrowTopRightOnSquareIcon className="tw-h-3.5 tw-w-3.5 tw-flex-shrink-0" />
          </button>
        </div>
      </div>

      <div className="tw-col-span-full tw-row-start-2 tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-text-sm tw-leading-6 lg:tw-col-start-1 lg:tw-col-end-2 lg:tw-mt-2">
        <span className="tw-text-iron-400">{metadataLabel}</span>
        {profileCurationLabel && (
          <>
            <span className="tw-text-iron-600">•</span>
            <span className="tw-inline-flex tw-max-w-full tw-items-center tw-gap-1.5 tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-300">
              <span className="tw-flex-shrink-0 tw-text-iron-500">
                Curation:
              </span>
              <span className="tw-min-w-0 tw-truncate tw-text-iron-200">
                {profileCurationLabel}
              </span>
            </span>
          </>
        )}
      </div>

      {canManageOwnOfficialWave && (
        <div className="tw-contents lg:tw-col-start-2 lg:tw-row-span-2 lg:tw-row-start-1 lg:tw-flex lg:tw-items-start lg:tw-justify-end lg:tw-gap-2">
          {onAddPost !== undefined && (
            <button
              type="button"
              onClick={onAddPost}
              className="tw-col-start-2 tw-row-start-1 tw-inline-flex tw-flex-shrink-0 tw-items-center tw-justify-center tw-gap-1.5 tw-self-center tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-white tw-bg-white tw-px-3.5 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-950 tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white desktop-hover:hover:tw-border-iron-200 desktop-hover:hover:tw-bg-iron-100 sm:tw-py-1.5"
            >
              <PlusIcon className="-tw-ml-1 tw-h-4 tw-w-4 tw-flex-shrink-0" />
              <span className="tw-text-xs sm:tw-text-sm">Add post</span>
            </button>
          )}
          <fieldset className="tw-no-scrollbar tw-col-span-full tw-row-start-3 tw-mx-0 tw-mb-0 tw-mt-2 tw-w-full tw-min-w-0 tw-overflow-x-auto tw-border-0 tw-p-0 lg:tw-mt-0 lg:tw-w-auto lg:tw-overflow-visible">
            <legend className="tw-sr-only">Profile wave switch controls</legend>
            <div className="tw-flex tw-w-max tw-items-center tw-gap-2 lg:tw-w-auto lg:tw-justify-end">
              <div className="tw-flex tw-w-auto tw-flex-shrink-0 tw-items-center tw-gap-0.5 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/5 tw-p-0.5 tw-shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
                <div
                  ref={changeWaveDropdownRef}
                  className="tw-relative tw-flex-none"
                >
                  <button
                    ref={changeWaveButtonRef}
                    type="button"
                    onClick={onOpenChangeWave}
                    aria-expanded={isChangeWaveOpen}
                    aria-haspopup="menu"
                    aria-controls={changeWaveDropdownId}
                    className={`tw-inline-flex tw-w-auto tw-items-center tw-justify-center tw-gap-2 tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-1.5 tw-text-sm tw-font-semibold tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-300 sm:tw-px-3.5 sm:tw-py-2 md:tw-py-1.5 ${
                      isChangeWaveOpen
                        ? "tw-border-white/10 tw-bg-iron-800 tw-text-iron-50 tw-shadow-inner"
                        : "tw-border-transparent tw-bg-transparent tw-text-iron-200 desktop-hover:hover:tw-bg-white/5 desktop-hover:hover:tw-text-iron-50"
                    }`}
                  >
                    <span className="tw-text-xs lg:tw-text-sm">
                      Switch wave
                    </span>
                    <ChevronDownIcon
                      aria-hidden="true"
                      className={`-tw-mr-1.5 tw-h-4 tw-w-4 tw-flex-shrink-0 tw-transition tw-duration-200 ${
                        isChangeWaveOpen ? "tw-rotate-180" : ""
                      }`}
                    />
                  </button>

                  {changeWaveDropdownId && (
                    <div
                      id={changeWaveDropdownId}
                      className="tw-absolute tw-right-0 tw-top-full tw-z-20 tw-mt-1 tw-hidden tw-w-72 lg:tw-block"
                    >
                      {changeWaveDropdown}
                    </div>
                  )}
                </div>
                {showChangeCuration && onOpenChangeCuration !== undefined && (
                  <>
                    <div className="tw-mx-1 tw-h-3.5 tw-w-px tw-flex-shrink-0 tw-bg-white/10" />
                    <div
                      ref={changeCurationDropdownRef}
                      className="tw-relative tw-flex-none"
                    >
                      <button
                        ref={changeCurationButtonRef}
                        type="button"
                        onClick={onOpenChangeCuration}
                        disabled={isChangingCuration}
                        aria-expanded={isChangeCurationOpen}
                        aria-haspopup="menu"
                        aria-controls={changeCurationDropdownId}
                        className={`tw-inline-flex tw-w-auto tw-items-center tw-justify-center tw-gap-2 tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-1.5 tw-text-sm tw-font-semibold tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-300 disabled:tw-cursor-not-allowed disabled:tw-text-iron-600 sm:tw-px-3.5 sm:tw-py-2 md:tw-py-1.5 ${
                          isChangeCurationOpen
                            ? "tw-border-white/10 tw-bg-iron-800 tw-text-iron-50 tw-shadow-inner"
                            : "tw-border-transparent tw-bg-transparent tw-text-iron-200 desktop-hover:hover:tw-bg-white/5 desktop-hover:hover:tw-text-iron-50"
                        }`}
                      >
                        <span className="tw-text-xs lg:tw-text-sm">
                          Switch curation
                        </span>
                        <ChevronDownIcon
                          aria-hidden="true"
                          className={`-tw-mr-1.5 tw-h-4 tw-w-4 tw-flex-shrink-0 tw-transition tw-duration-200 ${
                            isChangeCurationOpen ? "tw-rotate-180" : ""
                          }`}
                        />
                      </button>

                      {changeCurationDropdownId && (
                        <div
                          id={changeCurationDropdownId}
                          className="tw-absolute tw-right-0 tw-top-full tw-z-20 tw-mt-1 tw-hidden tw-w-72 lg:tw-block"
                        >
                          {changeCurationDropdown}
                        </div>
                      )}
                    </div>
                  </>
                )}
                <div className="tw-mx-1 tw-h-3.5 tw-w-px tw-flex-shrink-0 tw-bg-white/10" />
                <button
                  type="button"
                  onClick={onRemoveWave}
                  disabled={isRemoving}
                  aria-label="Unset featured wave"
                  title="Unset featured wave"
                  className="tw-inline-flex tw-flex-shrink-0 tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-[10px] tw-border tw-border-solid tw-border-transparent tw-bg-transparent tw-px-2.5 tw-py-1.5 tw-text-sm tw-font-semibold tw-text-zinc-500 tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-rose-400 disabled:tw-cursor-not-allowed disabled:tw-text-iron-600 desktop-hover:hover:tw-border-rose-500/20 desktop-hover:hover:tw-bg-rose-500/10 desktop-hover:hover:tw-text-rose-400 sm:tw-px-3.5 sm:tw-py-1.5"
                >
                  {isRemoving ? (
                    <CircleLoader />
                  ) : (
                    <XMarkIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
                  )}
                  <span className="tw-text-xs lg:tw-text-sm">Unset</span>
                </button>
              </div>
            </div>
          </fieldset>
        </div>
      )}
    </div>
  );
}
