"use client";

import {
  DROPDOWN_CHECKMARK_CLASSES,
  DROPDOWN_SELECTED_OPTION_CLASSES,
} from "@/components/utils/select/dropdown/dropdownTriggerStyles";
import CommonDropdownItemsWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsWrapper";
import { getVolumeTypeLabel } from "@/components/the-memes/theMemesI18n";
import { VolumeType } from "@/entities/INFT";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { faCheck, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRef, useState } from "react";
import { getMemesSortButtonClasses } from "./theMemesSortStyles";
import { getCollectionSortButtonClasses } from "@/components/collection-page/collectionSortStyles";

const VOLUME_TYPES = Object.values(VolumeType);

export default function VolumeTypeDropdown({
  isVolumeSort,
  selectedVolumeSort,
  setVolumeType,
  setVolumeSort,
  locale,
  presentation = "responsive",
}: {
  readonly isVolumeSort: boolean;
  readonly selectedVolumeSort: VolumeType;
  readonly setVolumeType: (volumeType: VolumeType) => void;
  readonly setVolumeSort: () => void;
  readonly locale?: SupportedLocale;
  readonly presentation?: "responsive" | "underline";
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

  const triggerProps = {
    ref: buttonRef,
    "aria-haspopup": true as const,
    "aria-pressed": isVolumeSort,
    "aria-expanded": isOpen,
    "aria-label": t(resolvedLocale, "theMemes.volume.triggerWithValue", {
      volumeType: selectedVolumeLabel,
    }),
    onClick: () => setIsOpen(!isOpen),
  };
  const triggerContent = (
    <>
      <span className="tw-flex tw-min-w-0 tw-items-center tw-gap-1.5">
        <span className="tw-shrink-0 tw-whitespace-nowrap">
          {t(resolvedLocale, "theMemes.volume.trigger")}
          {isVolumeSort ? ":" : ""}
        </span>
        {isVolumeSort && (
          <span className="tw-truncate">{selectedVolumeLabel}</span>
        )}
      </span>
      <FontAwesomeIcon
        icon={faChevronDown}
        className={`tw-h-3 tw-w-3 tw-shrink-0 tw-transition-transform tw-duration-200 ${
          isOpen ? "tw-rotate-180" : ""
        }`}
        aria-hidden="true"
      />
    </>
  );

  return (
    <div
      data-testid="dropdown"
      className="tailwind-scope tw-relative tw-inline-flex tw-shrink-0"
    >
      <button
        {...triggerProps}
        type="button"
        className={
          presentation === "underline"
            ? `${getCollectionSortButtonClasses(isVolumeSort)} tw-inline-flex tw-items-center tw-gap-x-1.5`
            : getMemesSortButtonClasses(isVolumeSort)
        }
      >
        {triggerContent}
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
                aria-current={isActive ? "true" : undefined}
                onClick={() => handleSelect(volumeType)}
                className={`${
                  isMobile
                    ? "tw-min-h-12 tw-px-3 tw-py-3 max-lg:tw-rounded-lg max-lg:tw-text-[15px]"
                    : "tw-px-3 tw-py-2"
                } tw-box-border tw-flex tw-w-full tw-max-w-full tw-items-center tw-justify-between tw-gap-x-2 tw-overflow-hidden tw-rounded-md tw-border-0 tw-text-left tw-text-sm tw-font-medium tw-transition tw-duration-200 tw-ease-out hover:tw-bg-iron-800 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 ${
                  isActive
                    ? DROPDOWN_SELECTED_OPTION_CLASSES
                    : "tw-bg-transparent tw-text-iron-200"
                }`}
              >
                <span className="tw-min-w-0 tw-flex-1 tw-truncate">
                  {getVolumeTypeLabel(volumeType, resolvedLocale)}
                </span>
                {isActive && (
                  <FontAwesomeIcon
                    icon={faCheck}
                    className={`tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 ${DROPDOWN_CHECKMARK_CLASSES}`}
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
