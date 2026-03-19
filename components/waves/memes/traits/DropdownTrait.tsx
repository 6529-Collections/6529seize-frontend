"use client";

import { CheckCircleIcon } from "@heroicons/react/24/outline";
import React, { useCallback, useRef } from "react";
import type { TraitsData } from "../submission/types/TraitsData";
import { TraitWrapper } from "./TraitWrapper";

interface DropdownTraitProps {
  readonly label: string;
  readonly field: keyof TraitsData;
  readonly className?: string | undefined;
  readonly error?: string | null | undefined;
  readonly onBlur?: ((field: keyof TraitsData) => void) | undefined;
  readonly options: readonly string[];
  readonly traits: TraitsData;
  readonly updateText: (field: keyof TraitsData, value: string) => void;
  readonly showRequiredMarker?: boolean | undefined;
  readonly size?: "default" | "sm" | undefined;
}

const SELECT_PLACEHOLDER_COLOR = "#848490";
const SELECT_VALUE_COLOR = "#EFEFF1";
const EMPTY_RING_CLASSES = ["tw-ring-iron-700", "desktop-hover:hover:tw-ring-iron-650"];
const FILLED_RING_CLASSES = [
  "tw-ring-emerald-600/45",
  "desktop-hover:hover:tw-ring-emerald-600/55",
];
const getSelectTextColor = (value: string) =>
  value.trim().length > 0 ? SELECT_VALUE_COLOR : SELECT_PLACEHOLDER_COLOR;

/**
 * Simplified DropdownTrait component with direct state management
 */
export const DropdownTrait: React.FC<DropdownTraitProps> = React.memo(
  ({
    label,
    field,
    traits,
    updateText,
    options,
    className,
    error,
    onBlur,
    showRequiredMarker = false,
    size = "default",
  }) => {
    const selectRef = useRef<HTMLSelectElement>(null);
    const successIconRef = useRef<HTMLSpanElement>(null);
    const currentValue = (traits[field] as string) || "";
    const isFieldFilled = currentValue.trim().length > 0;
    const showSuccessIcon = isFieldFilled && !error;

    const syncSuccessIconVisibility = useCallback(
      (value: string, hasError: boolean) => {
        successIconRef.current?.classList.toggle(
          "tw-hidden",
          value.trim().length === 0 || hasError
        );
      },
      []
    );

    const syncSelectVisualState = useCallback(
      (element: HTMLSelectElement, value: string, hasError: boolean) => {
        element.style.color = getSelectTextColor(value);
        element.classList.remove(
          ...EMPTY_RING_CLASSES,
          ...FILLED_RING_CLASSES,
          "tw-ring-red"
        );

        if (hasError) {
          element.classList.add("tw-ring-red");
        } else if (value.trim().length > 0) {
          element.classList.add(...FILLED_RING_CLASSES);
        } else {
          element.classList.add(...EMPTY_RING_CLASSES);
        }

        syncSuccessIconVisibility(value, hasError);
      },
      [syncSuccessIconVisibility]
    );

    React.useEffect(() => {
      if (selectRef.current && currentValue !== selectRef.current.value) {
        selectRef.current.value = currentValue;
      }
      if (selectRef.current) {
        syncSelectVisualState(selectRef.current, currentValue, Boolean(error));
      }
    }, [currentValue, error, syncSelectVisualState]);

    // Handle change events
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = e.target.value;
        syncSelectVisualState(e.target, newValue, Boolean(error));
        // For dropdowns, we can update immediately
        updateText(field, newValue);
      },
      [error, field, syncSelectVisualState, updateText]
    );

    // Handle blur events
    const handleBlur = useCallback(() => {
      // Call parent onBlur if provided
      if (onBlur) {
        onBlur(field);
      }
    }, [onBlur, field]);

    const paddingClass =
      size === "sm" ? "tw-px-3 tw-py-2.5" : "tw-px-4 tw-py-3.5";

    return (
      <TraitWrapper
        label={label}
        className={className}
        error={error}
        isFieldFilled={isFieldFilled}
        showRequiredMarker={showRequiredMarker}
        labelRightAdornment={
          <span
            ref={successIconRef}
            className={showSuccessIcon ? "" : "tw-hidden"}
          >
            <CheckCircleIcon className="tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-text-emerald-500" />
          </span>
        }
        size={size}
      >
        <select
          ref={selectRef}
          defaultValue={currentValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`tw-form-select tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-outline-none ${paddingClass} tw-cursor-pointer tw-text-base sm:tw-text-sm tw-ring-1 tw-transition-all tw-duration-500 tw-ease-in-out focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:hover:tw-ring-primary-400 tw-appearance-none [&>option]:tw-bg-iron-950 [&>option]:tw-text-iron-100`}
          style={{ color: getSelectTextColor(currentValue) }}
        >
          <option
            value=""
            className="tw-bg-iron-950"
            style={{ color: SELECT_PLACEHOLDER_COLOR }}>
            Select {label}
          </option>
          {options.map((option) => (
            <option
              key={option}
              value={option}
              className="tw-bg-iron-950"
              style={{ color: SELECT_VALUE_COLOR }}>
              {option}
            </option>
          ))}
        </select>
      </TraitWrapper>
    );
  }
);

DropdownTrait.displayName = "DropdownTrait";
