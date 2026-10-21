"use client";

import FilterButton from "@/components/utils/button/FilterButton";
import CommonDropdownItemsWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsWrapper";
import { getVolumeTypeLabel } from "@/components/the-memes/theMemesI18n";
import { VolumeType } from "@/entities/INFT";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { faCheck, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRef, useState } from "react";

const VOLUME_TYPES = Object.values(VolumeType);
const VOLUME_TRIGGER_LABEL_CLASS =
  "tw-shrink-0 tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-500";
const VOLUME_TRIGGER_VALUE_CLASS =
  "tw-truncate tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-200 group-hover:tw-text-white";

export default function VolumeTypeDropdown({
  isVolumeSort,
  selectedVolumeSort,
  setVolumeType,
  setVolumeSort,
  locale,
}: {
  readonly isVolumeSort: boolean;
  readonly selectedVolumeSort: VolumeType;
  readonly setVolumeType: (volumeType: VolumeType) => void;
  readonly setVolumeSort: () => void;
  readonly locale?: SupportedLocale;
}) {
  const resolvedLocale = locale ?? DEFAULT_LOCALE;
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const selectedVolumeLabel = getVolumeTypeLabel(
    selectedVolumeSort,
    resolvedLocale
  );

  const handleSelect = (volumeType: VolumeType) => {
    setVolumeType(volumeType);
    if (!isVolumeSort) {
      setVolumeSort();
    }
    setIsOpen(false);
  };

  return (
    <div
      data-testid="dropdown"
      className="tailwind-scope tw-relative tw-inline-flex tw-shrink-0"
    >
      <FilterButton
        ref={buttonRef}
        selected={isVolumeSort}
        aria-haspopup="true"
        aria-pressed={isVolumeSort}
        aria-expanded={isOpen}
        aria-label={t(resolvedLocale, "theMemes.volume.triggerWithValue", {
          volumeType: selectedVolumeLabel,
        })}
        onClick={() => setIsOpen(!isOpen)}
        className={`tw-group tw-relative tw-m-0 tw-no-underline sm:tw-h-auto sm:tw-shrink sm:tw-rounded-md sm:tw-border-0 sm:tw-bg-transparent sm:tw-px-0.5 sm:tw-py-1 sm:tw-text-sm sm:tw-font-semibold sm:tw-leading-5 sm:tw-shadow-none sm:after:tw-absolute sm:after:-tw-bottom-0.5 sm:after:tw-left-0 sm:after:tw-h-px sm:after:tw-w-full sm:after:tw-origin-left sm:after:tw-transition-transform sm:after:tw-duration-200 sm:after:tw-content-[''] sm:focus:tw-outline-none sm:focus-visible:tw-text-iron-100 sm:focus-visible:tw-outline-none sm:focus-visible:tw-ring-2 sm:focus-visible:tw-ring-inset sm:focus-visible:tw-ring-primary-400 sm:active:tw-bg-transparent sm:desktop-hover:hover:tw-bg-transparent max-sm:[&_span]:tw-text-xs max-sm:[&_span]:tw-text-inherit ${
          isVolumeSort
            ? "sm:tw-text-white sm:after:tw-scale-x-100 sm:after:tw-bg-primary-400 sm:active:tw-text-white sm:desktop-hover:hover:tw-text-white"
            : "sm:tw-text-iron-500 sm:after:tw-scale-x-0 sm:after:tw-bg-iron-700 sm:hover:after:tw-scale-x-100 sm:desktop-hover:hover:tw-text-iron-200"
        }`}
      >
        <span className="tw-flex tw-min-w-0 tw-items-center tw-gap-1.5">
          <span className={VOLUME_TRIGGER_LABEL_CLASS}>
            {t(resolvedLocale, "theMemes.volume.trigger")}
            {isVolumeSort ? ":" : ""}
          </span>
          {isVolumeSort && (
            <span className={VOLUME_TRIGGER_VALUE_CLASS}>
              {selectedVolumeLabel}
            </span>
          )}
        </span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`tw-h-3 tw-w-3 tw-shrink-0 tw-text-iron-500 tw-transition-transform tw-duration-200 group-hover:tw-text-iron-300 ${
            isOpen ? "tw-rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </FilterButton>

      <CommonDropdownItemsWrapper
        isOpen={isOpen}
        filterLabel={t(resolvedLocale, "theMemes.volume.trigger")}
        buttonRef={buttonRef}
        horizontalAlign="right"
        portalClassName="tailwind-scope tw-z-[999]"
        setOpen={setIsOpen}
        onIsMobile={setIsMobile}
      >
        {VOLUME_TYPES.map((volumeType) => {
          const isActive = selectedVolumeSort === volumeType;

          return (
            <li
              key={`volume-${volumeType}`}
              className="tw-h-full tw-min-w-0"
              role="none"
            >
              <button
                type="button"
                data-testid="item"
                role="menuitem"
                aria-current={isActive ? "true" : undefined}
                onClick={() => handleSelect(volumeType)}
                className={`${
                  isMobile
                    ? "tw-min-h-12 tw-px-3 tw-py-3 max-lg:tw-rounded-lg max-lg:tw-text-[15px]"
                    : "tw-px-3 tw-py-2"
                } tw-box-border tw-flex tw-w-full tw-max-w-full tw-items-center tw-justify-between tw-gap-x-2 tw-overflow-hidden tw-rounded-md tw-border-0 tw-bg-transparent tw-text-left tw-text-sm tw-font-medium tw-text-iron-200 tw-transition tw-duration-200 tw-ease-out hover:tw-bg-iron-800 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 ${
                  isActive ? "tw-bg-iron-800 tw-text-iron-100" : ""
                }`}
              >
                <span className="tw-min-w-0 tw-flex-1 tw-truncate">
                  {getVolumeTypeLabel(volumeType, resolvedLocale)}
                </span>
                {isActive && (
                  <FontAwesomeIcon
                    icon={faCheck}
                    className="tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-text-primary-300"
                    aria-hidden="true"
                  />
                )}
              </button>
            </li>
          );
        })}
      </CommonDropdownItemsWrapper>
    </div>
  );
}
