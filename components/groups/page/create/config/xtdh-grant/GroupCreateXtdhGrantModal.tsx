"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useClickAway, useDebounce, useKeyPressEvent } from "react-use";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import type { ApiXTdhGrant } from "@/generated/models/ApiXTdhGrant";
import { ApiXTdhGrantStatus } from "@/generated/models/ApiXTdhGrantStatus";
import { useXtdhGrantsSearchQuery } from "@/hooks/useXtdhGrantsSearchQuery";
import {
  formatAmount,
  formatDateTime,
} from "@/components/user/xtdh/utils/xtdhGrantFormatters";
import { getGrantStatusLabel, toShortGrantId } from "./utils";

interface GroupCreateXtdhGrantModalProps {
  readonly isOpen: boolean;
  readonly selectedGrantId: string | null;
  readonly onClose: () => void;
  readonly onGrantSelect: (grant: ApiXTdhGrant) => void;
}

const STATUS_OPTIONS: readonly CommonSelectItem<ApiXTdhGrantStatus>[] = [
  {
    key: ApiXTdhGrantStatus.Granted,
    value: ApiXTdhGrantStatus.Granted,
    label: "Granted",
  },
  {
    key: ApiXTdhGrantStatus.Pending,
    value: ApiXTdhGrantStatus.Pending,
    label: "Pending",
  },
  {
    key: ApiXTdhGrantStatus.Disabled,
    value: ApiXTdhGrantStatus.Disabled,
    label: "Revoked",
  },
  {
    key: ApiXTdhGrantStatus.Failed,
    value: ApiXTdhGrantStatus.Failed,
    label: "Failed",
  },
];

const getStatusPillClasses = (statusLabel: string): string => {
  if (statusLabel === "ACTIVE") {
    return "tw-bg-green/20 tw-text-green";
  }
  if (statusLabel === "SCHEDULED") {
    return "tw-bg-blue-400/20 tw-text-blue-200";
  }
  if (statusLabel === "ENDED") {
    return "tw-bg-iron-700/30 tw-text-iron-400";
  }
  if (statusLabel === "PENDING") {
    return "tw-bg-primary-400/20 tw-text-primary-300";
  }
  return "tw-bg-red/20 tw-text-red";
};

export default function GroupCreateXtdhGrantModal({
  isOpen,
  selectedGrantId,
  onClose,
  onGrantSelect,
}: GroupCreateXtdhGrantModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const skipInitialOutsideClick = useRef(true);

  const [grantorInput, setGrantorInput] = useState("");
  const [targetCollectionInput, setTargetCollectionInput] = useState("");
  const [grantorFilter, setGrantorFilter] = useState("");
  const [targetCollectionFilter, setTargetCollectionFilter] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ApiXTdhGrantStatus>(
    ApiXTdhGrantStatus.Granted
  );

  useEffect(() => {
    const timeout = globalThis.setTimeout(() => {
      skipInitialOutsideClick.current = false;
    }, 0);

    return () => {
      globalThis.clearTimeout(timeout);
    };
  }, [isOpen]);

  useDebounce(() => setGrantorFilter(grantorInput.trim()), 250, [grantorInput]);
  useDebounce(
    () => setTargetCollectionFilter(targetCollectionInput.trim()),
    250,
    [targetCollectionInput]
  );

  useClickAway(modalRef, () => {
    if (skipInitialOutsideClick.current) {
      skipInitialOutsideClick.current = false;
      return;
    }
    onClose();
  });
  useKeyPressEvent("Escape", onClose);

  const {
    grants,
    totalCount,
    isLoading,
    isError,
    errorMessage,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useXtdhGrantsSearchQuery({
    grantor: grantorFilter || null,
    targetCollectionName: targetCollectionFilter || null,
    statuses: [selectedStatus],
    enabled: isOpen,
    pageSize: 20,
  });

  const onResetFilters = () => {
    setGrantorInput("");
    setTargetCollectionInput("");
    setGrantorFilter("");
    setTargetCollectionFilter("");
    setSelectedStatus(ApiXTdhGrantStatus.Granted);
  };

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="tailwind-scope tw-relative tw-z-1000">
      <div className="tw-fixed tw-inset-0 tw-bg-gray-600 tw-bg-opacity-50"></div>
      <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
        <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-p-2 tw-text-center sm:tw-items-center lg:tw-p-4">
          <div
            ref={modalRef}
            className="tw-relative tw-w-full tw-transform tw-rounded-xl tw-bg-iron-950 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 sm:tw-max-w-4xl"
          >
            <div className="tw-flex tw-items-start tw-justify-between tw-gap-4 tw-border-b tw-border-solid tw-border-iron-800 tw-p-4 sm:tw-p-5">
              <div className="tw-space-y-1">
                <p className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50">
                  Find xTDH Grant
                </p>
                <p className="tw-m-0 tw-text-sm tw-text-iron-400">
                  Search global grants and select one for beneficiary filtering.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="tw-rounded-full tw-border-0 tw-bg-transparent tw-p-2 tw-text-iron-400 tw-transition tw-duration-200 desktop-hover:hover:tw-text-iron-100"
              >
                <span className="tw-sr-only">Close grant picker</span>
                <svg
                  className="tw-h-5 tw-w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="tw-space-y-4 tw-p-4 sm:tw-p-5">
              <div className="tw-grid tw-grid-cols-1 tw-gap-3 lg:tw-grid-cols-2">
                <label className="tw-block">
                  <span className="tw-mb-1 tw-block tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
                    Grantor
                  </span>
                  <input
                    type="text"
                    value={grantorInput}
                    onChange={(event) => setGrantorInput(event.target.value)}
                    placeholder="Handle or wallet"
                    className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-py-2.5 tw-text-sm tw-text-iron-50 tw-ring-1 tw-ring-inset tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-ring-primary-400"
                  />
                </label>
                <label className="tw-block">
                  <span className="tw-mb-1 tw-block tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
                    Collection
                  </span>
                  <input
                    type="text"
                    value={targetCollectionInput}
                    onChange={(event) =>
                      setTargetCollectionInput(event.target.value)
                    }
                    placeholder="Collection name"
                    className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-py-2.5 tw-text-sm tw-text-iron-50 tw-ring-1 tw-ring-inset tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-ring-primary-400"
                  />
                </label>
              </div>

              <div className="tw-flex tw-flex-wrap tw-items-end tw-justify-between tw-gap-3">
                <div className="tw-min-w-0 tw-flex-1">
                  <span className="tw-mb-1 tw-block tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
                    Status
                  </span>
                  <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
                    {STATUS_OPTIONS.map((statusOption) => {
                      const isActive = selectedStatus === statusOption.value;
                      return (
                        <button
                          key={statusOption.key}
                          type="button"
                          onClick={() => setSelectedStatus(statusOption.value)}
                          className={`tw-rounded-md tw-border tw-border-solid tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold tw-transition tw-duration-200 ${
                            isActive
                              ? "tw-border-primary-400 tw-bg-primary-400/20 tw-text-primary-300"
                              : "tw-border-iron-700 tw-bg-iron-900 tw-text-iron-300 desktop-hover:hover:tw-border-iron-600"
                          }`}
                        >
                          {statusOption.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="tw-h-[42px] tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-300 tw-transition tw-duration-200 desktop-hover:hover:tw-bg-iron-800"
                >
                  Clear filters
                </button>
              </div>

              <div className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/40">
                <div className="tw-flex tw-items-center tw-justify-between tw-border-b tw-border-solid tw-border-iron-800 tw-px-4 tw-py-2.5">
                  <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
                    Results
                  </p>
                  <p className="tw-m-0 tw-text-xs tw-text-iron-500">
                    {totalCount} total
                  </p>
                </div>

                <div className="tw-max-h-[360px] tw-overflow-y-auto tw-p-2 sm:tw-p-3">
                  {isLoading && !grants.length && (
                    <p className="tw-m-0 tw-rounded-lg tw-bg-iron-900 tw-p-4 tw-text-sm tw-text-iron-400">
                      Loading grants...
                    </p>
                  )}

                  {isError && !grants.length && (
                    <div className="tw-rounded-lg tw-border tw-border-solid tw-border-red/30 tw-bg-red/10 tw-p-4">
                      <p className="tw-m-0 tw-text-sm tw-text-red">
                        {errorMessage ?? "Unable to load grants."}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          refetch().catch(() => {
                            // Query error state is already rendered.
                          });
                        }}
                        className="tw-mt-3 tw-rounded-md tw-border tw-border-solid tw-border-red/40 tw-bg-red/20 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-red"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {!isLoading && !isError && !grants.length && (
                    <p className="tw-m-0 tw-rounded-lg tw-bg-iron-900 tw-p-4 tw-text-sm tw-text-iron-400">
                      No grants matched the selected filters.
                    </p>
                  )}

                  {!!grants.length && (
                    <ul className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-2 tw-p-0">
                      {grants.map((grant) => {
                        const statusLabel = getGrantStatusLabel({
                          status: grant.status,
                          validFrom: grant.valid_from,
                          validTo: grant.valid_to,
                        });
                        const trimmedCollectionName =
                          grant.target_collection_name?.trim() ?? "";
                        const targetLabel =
                          trimmedCollectionName.length > 0
                            ? trimmedCollectionName
                            : grant.target_contract || "Unknown target";
                        const isSelected = selectedGrantId === grant.id;

                        return (
                          <li
                            key={grant.id}
                            className={`tw-rounded-lg tw-border tw-border-solid tw-p-3 tw-transition tw-duration-200 ${
                              isSelected
                                ? "tw-border-primary-400 tw-bg-primary-500/10"
                                : "tw-border-iron-800 tw-bg-iron-900/70"
                            }`}
                          >
                            <div className="tw-flex tw-flex-col tw-gap-3 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between">
                              <div className="tw-min-w-0 tw-flex-1 tw-space-y-1.5">
                                <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
                                  <span
                                    className={`tw-inline-flex tw-items-center tw-rounded-full tw-px-2 tw-py-0.5 tw-text-[11px] tw-font-semibold tw-tracking-wide ${getStatusPillClasses(
                                      statusLabel
                                    )}`}
                                  >
                                    {statusLabel}
                                  </span>
                                  <p className="tw-m-0 tw-truncate tw-text-sm tw-font-semibold tw-text-iron-50">
                                    {targetLabel}
                                  </p>
                                </div>
                                <p className="tw-m-0 tw-text-xs tw-text-iron-400">
                                  ID: {toShortGrantId(grant.id)} | Rate:{" "}
                                  {formatAmount(grant.rate)}
                                </p>
                                <p className="tw-m-0 tw-text-xs tw-text-iron-500">
                                  Valid:{" "}
                                  {formatDateTime(grant.valid_from ?? null, {
                                    fallbackLabel: "Immediately",
                                    includeTime: false,
                                  })}{" "}
                                  {"->"}{" "}
                                  {formatDateTime(grant.valid_to ?? null, {
                                    fallbackLabel: "No expiry",
                                    includeTime: false,
                                  })}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => onGrantSelect(grant)}
                                className={`tw-h-9 tw-rounded-md tw-border tw-border-solid tw-px-4 tw-text-xs tw-font-semibold tw-transition tw-duration-200 ${
                                  isSelected
                                    ? "tw-border-primary-400 tw-bg-primary-500 tw-text-white"
                                    : "tw-border-iron-700 tw-bg-iron-900 tw-text-iron-300 desktop-hover:hover:tw-bg-iron-800"
                                }`}
                              >
                                {isSelected ? "Selected" : "Select"}
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {hasNextPage && (
                  <div className="tw-border-t tw-border-solid tw-border-iron-800 tw-p-3">
                    <button
                      type="button"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-300 tw-transition tw-duration-200 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-bg-iron-800"
                    >
                      {isFetchingNextPage ? "Loading..." : "Load more"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
