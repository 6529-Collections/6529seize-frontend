"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";

interface NftPickerActionsProps {
    canAddTokens: boolean;
    allowAll: boolean;
    selectedContract: boolean;
    selectAllLabel: string;
    onSelectAll: () => void;
}

export function NftPickerActions({
    canAddTokens,
    allowAll,
    selectedContract,
    selectAllLabel,
    onSelectAll,
}: NftPickerActionsProps) {
    const selectAllButtonClassName =
        "tw-flex tw-w-full tw-shrink-0 tw-items-center tw-justify-center tw-gap-2 tw-rounded-md tw-border tw-border-iron-700 tw-bg-iron-800 tw-px-4 tw-py-2.5 tw-font-medium tw-text-iron-300 tw-transition-colors hover:tw-bg-iron-700 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-500 focus:tw-ring-offset-2 focus:tw-ring-offset-iron-900 disabled:tw-cursor-not-allowed disabled:tw-border-iron-700 disabled:tw-bg-iron-900 disabled:tw-text-iron-600 sm:tw-w-auto";

    return (
        <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-center">
            <button
                type="submit"
                className="tw-inline-flex tw-w-full tw-shrink-0 tw-items-center tw-justify-center tw-gap-2 tw-rounded-md tw-bg-primary-600 tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-transition-colors hover:tw-bg-primary-700 disabled:tw-cursor-not-allowed disabled:tw-bg-iron-800 disabled:tw-text-iron-500 sm:tw-w-auto"
                disabled={!canAddTokens}
            >
                Add
            </button>
            {allowAll && (
                <button
                    type="button"
                    className={selectAllButtonClassName}
                    onClick={onSelectAll}
                    disabled={!selectedContract}
                    title={selectAllLabel}
                >
                    <FontAwesomeIcon
                        className="tw-h-5 tw-w-5"
                        icon={faCircle}
                        aria-hidden="true"
                    />
                    <span>{selectAllLabel}</span>
                </button>
            )}
        </div>
    );
}
