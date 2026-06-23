"use client";

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
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={t(resolvedLocale, "theMemes.volume.triggerWithValue", {
          volumeType: selectedVolumeLabel,
        })}
        onClick={() => setIsOpen(!isOpen)}
        className={`tw-group tw-relative tw-m-0 tw-inline-flex tw-shrink-0 tw-cursor-pointer tw-items-center tw-gap-1.5 tw-whitespace-nowrap tw-rounded-md tw-border-0 tw-bg-transparent tw-px-0.5 tw-py-1 tw-text-left tw-no-underline tw-shadow-none tw-transition-colors tw-duration-200 after:tw-absolute after:-tw-bottom-0.5 after:tw-left-0 after:tw-h-px after:tw-w-full after:tw-origin-left after:tw-transition-transform after:tw-duration-200 after:tw-content-[''] focus:tw-outline-none focus-visible:tw-text-iron-100 focus-visible:tw-outline-none sm:tw-shrink ${
          isVolumeSort
            ? "tw-text-white after:tw-scale-x-100 after:tw-bg-primary-400"
            : "tw-text-iron-500 after:tw-scale-x-0 after:tw-bg-iron-700 hover:tw-text-iron-200 hover:after:tw-scale-x-100"
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
      </button>

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
                onClick={() => handleSelect(volumeType)}
                className={`${
                  isMobile ? "tw-px-4 tw-py-3" : "tw-px-3 tw-py-2"
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
