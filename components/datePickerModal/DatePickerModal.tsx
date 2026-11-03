"use client";

import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useClickAway, useKeyPressEvent } from "react-use";

interface Props {
  mode: "date" | "block";
  show: boolean;
  initial_from_date?: Date | undefined;
  initial_to_date?: Date | undefined;
  initial_from_block?: number | undefined;
  initial_to_block?: number | undefined;
  onApplyDate?:
    | ((fromDate: Date, toDate: Date) => void)
    | undefined
    | undefined;
  onApplyBlock?:
    | ((fromBlock: number, toBlock: number) => void)
    | undefined
    | undefined;
  onHide: () => void;
}

const datePickerInputClass =
  "tw-form-input tw-block tw-w-full tw-rounded-none tw-border tw-border-solid tw-border-iron-650 tw-bg-white tw-px-3 tw-py-2 tw-text-base tw-text-iron-950 tw-shadow-none tw-transition placeholder:tw-text-iron-500 focus:tw-border-primary-400 focus:tw-bg-white focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400";

// The picker works in UTC calendar days: both fields hold "YYYY-MM-DD" strings
// (never full ISO timestamps, so they compare correctly as plain strings) and
// applying emits each day as 00:00 UTC, which is how API date filters read it.
function toUtcDateString(date: Date): string {
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

// The latest selectable day: today in UTC, read fresh on every use.
function getLatestSelectableDate(): string {
  return toUtcDateString(new Date());
}

// Holds one "YYYY-MM-DD" field. It starts from the initial date and is seeded
// again whenever the initial day changes, without an effect round trip.
function useUtcDateField(initial: Date | undefined) {
  const initialDay = initial ? toUtcDateString(initial) : undefined;
  const [value, setValue] = useState<string>(initialDay ?? "");
  const [seededFrom, setSeededFrom] = useState<string | undefined>(initialDay);
  if (initialDay !== seededFrom) {
    setSeededFrom(initialDay);
    if (initialDay !== undefined) setValue(initialDay);
  }
  return [value, setValue] as const;
}

export default function DatePickerModal(props: Readonly<Props>) {
  const locale = useBrowserLocale();
  const [fromDate, setFromDate] = useUtcDateField(props.initial_from_date);
  const [toDate, setToDate] = useUtcDateField(props.initial_to_date);

  const [fromBlock, setFromBlock] = useState("");
  const [toBlock, setToBlock] = useState("");

  const [error, setError] = useState<string>();
  const modalRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const errorId = useId();
  const utcNoteId = useId();
  const startInputId = useId();
  const endInputId = useId();

  useClickAway(modalRef, () => {
    if (props.show) {
      props.onHide();
    }
  });

  useEffect(() => {
    if (!props.show || typeof document === "undefined") {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = globalThis.setTimeout(() => modalRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = originalOverflow;
      globalThis.clearTimeout(timer);
    };
  }, [props.show]);
  useKeyPressEvent("Escape", () => {
    if (props.show) {
      props.onHide();
    }
  });

  useEffect(() => {
    if (props.initial_from_block)
      setFromBlock(props.initial_from_block.toString());
  }, [props.initial_from_block]);

  useEffect(() => {
    if (props.initial_to_block) setToBlock(props.initial_to_block.toString());
  }, [props.initial_to_block]);

  function applyDate() {
    if (fromDate && toDate) {
      if (fromDate > toDate) {
        setError("The start date must be before the end date.");
        return;
      }
    }
    // The input's `max` does not stop a typed later date from reaching Apply.
    const latestDate = getLatestSelectableDate();
    if (fromDate > latestDate || toDate > latestDate) {
      setError(t(locale, "datePicker.afterTodayError"));
      return;
    }
    props.onApplyDate?.(new Date(fromDate), new Date(toDate));
    props.onHide();
  }

  function applyBlock() {
    const fromBlockInt = Number.parseInt(fromBlock, 10);
    const toBlockInt = Number.parseInt(toBlock, 10);
    if (isNaN(fromBlockInt) || isNaN(toBlockInt)) {
      setError("Please enter a valid start and end block.");
      return;
    }
    if (fromBlockInt > toBlockInt) {
      setError("The start block must be before the end block.");
      return;
    }
    props.onApplyBlock?.(fromBlockInt, toBlockInt);
    props.onHide();
  }

  function apply() {
    if (props.mode === "date") {
      applyDate();
    } else {
      applyBlock();
    }
  }

  if (!props.show || typeof document === "undefined") {
    return null;
  }

  // The latest selectable day is today in UTC, matching the UTC day the API
  // filters on; the note below tells people that the days are UTC.
  const maxDate = getLatestSelectableDate();
  const dateDescribedBy = error ? `${utcNoteId} ${errorId}` : utcNoteId;

  return createPortal(
    <div className="tailwind-scope tw-fixed tw-inset-0 tw-z-[1055] tw-cursor-default">
      <div className="tw-absolute tw-inset-0 tw-bg-black/50" />
      <div className="tw-relative tw-flex tw-min-h-full tw-items-start tw-justify-center tw-overflow-y-auto tw-p-4 sm:tw-pt-12">
        <dialog
          ref={modalRef}
          open
          aria-modal="true"
          aria-labelledby={titleId}
          className="tw-m-0 tw-w-full tw-max-w-lg tw-rounded-none tw-border tw-border-solid tw-border-iron-650 tw-bg-[rgb(40,40,40)] tw-text-left tw-text-white tw-shadow-2xl"
        >
          <div className="tw-flex tw-items-center tw-justify-between tw-border-0 tw-border-b tw-border-solid tw-border-iron-650 tw-p-4">
            <h2 id={titleId} className="tw-m-0 tw-text-xl tw-font-medium">
              Select {props.mode}s
            </h2>
            <button
              type="button"
              aria-label="Close date picker"
              onClick={() => props.onHide()}
              className="tw-inline-flex tw-size-[30px] tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-white tw-transition hover:tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
            >
              <FontAwesomeIcon icon={faTimesCircle} />
            </button>
          </div>
          <div className="tw-flex tw-items-center tw-justify-between tw-p-4 tw-text-lg">
            <div className="tw-w-full">
              <div className="tw-mb-3">
                <label
                  className="tw-mb-2 tw-block tw-text-base tw-font-medium"
                  htmlFor={startInputId}
                >
                  Start {props.mode}
                </label>
                {props.mode === "date" ? (
                  <input
                    id={startInputId}
                    value={fromDate}
                    max={maxDate}
                    type="date"
                    placeholder="Start Date"
                    className={datePickerInputClass}
                    aria-invalid={Boolean(error)}
                    aria-describedby={dateDescribedBy}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value && value.length === 10) {
                        const tempDate = new Date(value);
                        if (!isNaN(tempDate.getTime())) {
                          setFromDate(value);
                        }
                      } else {
                        setFromDate("");
                      }
                    }}
                  />
                ) : (
                  <input
                    id={startInputId}
                    value={fromBlock}
                    className={datePickerInputClass}
                    type="number"
                    placeholder="Start Block"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? errorId : undefined}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value, 10);
                      if (isNaN(value)) {
                        setFromBlock("");
                      } else {
                        setFromBlock(value.toString());
                      }
                    }}
                  />
                )}
              </div>
              <div className="tw-mb-3">
                <label
                  className="tw-mb-2 tw-block tw-text-base tw-font-medium"
                  htmlFor={endInputId}
                >
                  End {props.mode}
                </label>
                {props.mode === "date" ? (
                  <input
                    id={endInputId}
                    value={toDate}
                    max={maxDate}
                    className={datePickerInputClass}
                    type="date"
                    placeholder="End Date"
                    aria-invalid={Boolean(error)}
                    aria-describedby={dateDescribedBy}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value && value.length === 10) {
                        const tempDate = new Date(value);
                        if (!isNaN(tempDate.getTime())) {
                          setToDate(value);
                        }
                      } else {
                        setToDate("");
                      }
                    }}
                  />
                ) : (
                  <input
                    id={endInputId}
                    value={toBlock}
                    className={datePickerInputClass}
                    type="number"
                    placeholder="End Block"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? errorId : undefined}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value, 10);
                      if (isNaN(value)) {
                        setToBlock("");
                      } else {
                        setToBlock(value.toString());
                      }
                    }}
                  />
                )}
              </div>
              {props.mode === "date" && (
                <p
                  id={utcNoteId}
                  className="tw-m-0 tw-text-sm tw-text-iron-300"
                >
                  {t(locale, "datePicker.utcNote")}
                </p>
              )}
            </div>
          </div>
          <div className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-650 tw-p-4">
            <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
              <span
                id={errorId}
                role={error ? "alert" : undefined}
                className="tw-min-h-5 tw-text-sm tw-text-error"
              >
                {error}
              </span>
              <span className="tw-flex tw-justify-end tw-gap-2">
                <Button
                  onClick={() => props.onHide()}
                  type="button"
                  variant="secondary"
                  size="md"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setError(undefined);
                    apply();
                  }}
                  type="button"
                  variant="primary"
                  size="md"
                >
                  Apply
                </Button>
              </span>
            </div>
          </div>
        </dialog>
      </div>
    </div>,
    document.body
  );
}
