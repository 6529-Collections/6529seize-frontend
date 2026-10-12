"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { useId, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useClickAway } from "react-use";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";

interface CreateWaveDropdownOption<TValue extends string> {
  readonly value: TValue;
  readonly label: string;
}

export default function CreateWaveDropdown<TValue extends string>({
  value,
  options,
  ariaLabel,
  ariaDescribedBy,
  ariaInvalid = false,
  dataTestId,
  hasError = false,
  accentValue = false,
  rounding = "all",
  disabled = false,
  mobileSheet = false,
  onChange,
}: {
  readonly value: TValue;
  readonly options: readonly CreateWaveDropdownOption<TValue>[];
  readonly ariaLabel: string;
  readonly ariaDescribedBy?: string | undefined;
  readonly ariaInvalid?: boolean | undefined;
  readonly dataTestId?: string | undefined;
  readonly hasError?: boolean | undefined;
  readonly accentValue?: boolean | undefined;
  readonly rounding?: "all" | "right" | undefined;
  readonly disabled?: boolean | undefined;
  readonly mobileSheet?: boolean | undefined;
  readonly onChange: (value: TValue) => void;
}) {
  const locale = useBrowserLocale();
  const isMobileViewport = useIsMobileLayoutViewport();
  const useMobileSheet = mobileSheet && isMobileViewport;
  const [isOpen, setIsOpen] = useState(false);
  const [menuPlacement, setMenuPlacement] = useState<"top" | "bottom">(
    "bottom"
  );
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();
  const dialogId = `${menuId}-dialog`;
  const popupId = useMobileSheet ? dialogId : menuId;
  const valueDescriptionId = `${menuId}-value`;
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );
  const selectedOption = options[selectedIndex];

  const closeMenu = (restoreFocus = false) => {
    setIsOpen(false);
    if (restoreFocus) {
      buttonRef.current?.focus();
    }
  };

  const selectOption = (option: CreateWaveDropdownOption<TValue>) => {
    if (disabled) return;
    onChange(option.value);
    closeMenu(true);
  };

  const focusOption = (index: number) => {
    const optionCount = options.length;
    if (!optionCount) return;
    const wrappedIndex = (index + optionCount) % optionCount;
    optionRefs.current[wrappedIndex]?.focus();
  };

  const openFromKeyboard = (index: number) => {
    setIsOpen(true);
    requestAnimationFrame(() => focusOption(index));
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (isOpen && event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeMenu(true);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openFromKeyboard(selectedIndex);
    }
  };

  const onOptionKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeMenu(true);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      focusOption(index + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusOption(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusOption(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusOption(options.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const option = options[index];
      if (option) {
        selectOption(option);
      }
    }
  };

  useClickAway(dropdownRef, () => {
    if (!useMobileSheet) closeMenu();
  });

  useLayoutEffect(() => {
    if (!isOpen || useMobileSheet) return;

    const updatePlacement = () => {
      const dropdown = dropdownRef.current;
      const button = buttonRef.current;
      const menu = menuRef.current;
      if (!dropdown || !button || !menu) return;

      let clippingTop = 0;
      let clippingBottom = window.innerHeight;
      let ancestor = dropdown.parentElement;

      while (ancestor) {
        const style = window.getComputedStyle(ancestor);
        if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) {
          const rect = ancestor.getBoundingClientRect();
          clippingTop = Math.max(clippingTop, rect.top);
          clippingBottom = Math.min(clippingBottom, rect.bottom);
        }
        ancestor = ancestor.parentElement;
      }

      const buttonRect = button.getBoundingClientRect();
      const menuHeight = menu.getBoundingClientRect().height;
      const gap = 4;
      const spaceBelow = clippingBottom - buttonRect.bottom;
      const spaceAbove = buttonRect.top - clippingTop;
      const nextPlacement =
        spaceBelow < menuHeight + gap && spaceAbove > spaceBelow
          ? "top"
          : "bottom";

      setMenuPlacement((current) =>
        current === nextPlacement ? current : nextPlacement
      );
    };

    updatePlacement();
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);
    return () => {
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [isOpen, useMobileSheet]);

  // A disabled form must not reopen a previously open picker when it unlocks.
  if (disabled && isOpen) setIsOpen(false);

  const stateClasses = hasError
    ? "tw-ring-error focus:tw-ring-error"
    : "tw-ring-white/10 desktop-hover:hover:tw-ring-white/15 desktop-hover:hover:focus:tw-ring-primary-400 focus:tw-ring-primary-400";
  const valueClasses = accentValue
    ? "tw-text-primary-400 focus:tw-text-white"
    : "tw-text-iron-300";
  const roundingClasses =
    rounding === "right" ? "tw-rounded-r-lg" : "tw-rounded-lg";
  const placementClasses =
    menuPlacement === "top" ? "tw-bottom-full tw-mb-1" : "tw-top-full tw-mt-1";
  const menuClasses = useMobileSheet
    ? ""
    : `tw-absolute tw-z-20 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-shadow-lg ${placementClasses}`;

  const optionList = (
    <ul
      ref={menuRef}
      id={menuId}
      role="listbox"
      aria-label={ariaLabel}
      data-placement={useMobileSheet ? undefined : menuPlacement}
      className={`tw-m-0 tw-w-full tw-list-none tw-bg-iron-950 tw-p-2 ${menuClasses}`}
    >
      {options.map((option, index) => (
        <li key={option.value} role="none">
          <button
            ref={(element) => {
              optionRefs.current[index] = element;
            }}
            type="button"
            role="option"
            aria-selected={option.value === value}
            disabled={disabled}
            onClick={() => selectOption(option)}
            onKeyDown={(event) => onOptionKeyDown(event, index)}
            className="tw-relative tw-flex tw-min-h-11 tw-w-full tw-cursor-pointer tw-select-none tw-items-center tw-justify-between tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-2.5 tw-text-left tw-text-sm tw-font-medium tw-text-white tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-white/[0.06] motion-reduce:tw-transition-none"
          >
            <span>{option.label}</span>
            {option.value === value && (
              <FontAwesomeIcon
                icon={faCheck}
                className="tw-ml-2 tw-size-4 tw-flex-shrink-0 tw-text-primary-300"
                aria-hidden="true"
              />
            )}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div
      className="tw-relative tw-w-full"
      ref={dropdownRef}
      onBlur={(event) => {
        if (useMobileSheet) return;
        if (
          event.relatedTarget instanceof Node &&
          event.currentTarget.contains(event.relatedTarget)
        ) {
          return;
        }
        closeMenu();
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-describedby={
          ariaDescribedBy
            ? `${valueDescriptionId} ${ariaDescribedBy}`
            : valueDescriptionId
        }
        aria-invalid={ariaInvalid || undefined}
        aria-haspopup={useMobileSheet ? "dialog" : "listbox"}
        aria-expanded={isOpen && !disabled}
        aria-controls={isOpen && !disabled ? popupId : undefined}
        disabled={disabled}
        data-testid={dataTestId}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={onTriggerKeyDown}
        className={`${stateClasses} ${valueClasses} ${roundingClasses} tw-flex tw-h-11 tw-w-full tw-items-center tw-justify-between tw-border-0 tw-bg-iron-950 tw-px-3 tw-text-base tw-font-medium tw-shadow-inner tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-inset disabled:tw-cursor-not-allowed disabled:tw-opacity-50 motion-reduce:tw-transition-none sm:tw-text-sm`}
      >
        <span>{selectedOption?.label}</span>
        <FontAwesomeIcon
          icon={faChevronDown}
          aria-hidden="true"
          className={`tw-ml-2 tw-size-4 tw-flex-shrink-0 tw-text-primary-400 tw-transition-transform tw-duration-300 motion-reduce:tw-transition-none ${
            isOpen ? "tw-rotate-180" : ""
          }`}
        />
      </button>
      <span id={valueDescriptionId} className="tw-sr-only">
        {t(locale, "waves.create.dropdown.currentValue", {
          value: selectedOption?.label ?? "",
        })}
      </span>

      {useMobileSheet ? (
        <MobileWrapperDialog
          id={dialogId}
          title={ariaLabel}
          isOpen={isOpen && !disabled}
          onClose={() => closeMenu()}
        >
          {optionList}
        </MobileWrapperDialog>
      ) : (
        isOpen && !disabled && optionList
      )}
    </div>
  );
}
