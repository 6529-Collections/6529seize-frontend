"use client";

import { useEffect, useMemo, useState } from "react";
import { NftPicker } from "@/components/nft-picker/NftPicker";
import CommonCalendar from "@/components/utils/calendar/CommonCalendar";
import TimePicker from "@/components/common/TimePicker";
import type {
  ContractOverview,
  NftPickerSelection,
} from "@/components/nft-picker/NftPicker.types";

const formatDateTime = (date: Date) =>
  new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

export default function UserPageXtdhGrant() {
  const [contract, setContract] = useState<ContractOverview | null>(null);
  const [selection, setSelection] = useState<NftPickerSelection | null>(null);

  const baselineExpiry = useMemo(() => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + 10);
    date.setSeconds(0, 0);
    return date;
  }, []);

  const [neverExpires, setNeverExpires] = useState<boolean>(true);
  const [validUntil, setValidUntil] = useState<Date | null>(null);
  const [validHours, setValidHours] = useState<number>(baselineExpiry.getHours());
  const [validMinutes, setValidMinutes] = useState<number>(baselineExpiry.getMinutes());

  useEffect(() => {
    if (!neverExpires && !validUntil) {
      setValidUntil(new Date(baselineExpiry));
      setValidHours(baselineExpiry.getHours());
      setValidMinutes(baselineExpiry.getMinutes());
    }
    if (neverExpires) {
      setValidUntil(null);
    }
  }, [baselineExpiry, neverExpires, validUntil]);

  const minTimestamp = useMemo(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    return now.getTime();
  }, []);

  const activeExpiry = validUntil ?? baselineExpiry;

  const onCalendarSelect = (timestamp: number) => {
    const next = new Date(timestamp);
    next.setHours(validHours);
    next.setMinutes(validMinutes);
    next.setSeconds(0, 0);

    if (next.getTime() < minTimestamp) {
      const minDate = new Date(minTimestamp);
      setValidUntil(minDate);
      setValidHours(minDate.getHours());
      setValidMinutes(minDate.getMinutes());
      return;
    }

    setValidUntil(next);
  };

  const onTimeChange = (hours: number, minutes: number) => {
    setValidHours(hours);
    setValidMinutes(minutes);

    const target = new Date(activeExpiry);
    target.setHours(hours);
    target.setMinutes(minutes);
    target.setSeconds(0, 0);

    if (target.getTime() < minTimestamp) {
      const minDate = new Date(minTimestamp);
      setValidUntil(minDate);
      setValidHours(minDate.getHours());
      setValidMinutes(minDate.getMinutes());
      return;
    }

    setValidUntil(target);
  };

  const timePickerMin = useMemo(() => {
    const today = new Date(minTimestamp);
    return activeExpiry.toDateString() === today.toDateString()
      ? { hours: today.getHours(), minutes: today.getMinutes() }
      : null;
  }, [activeExpiry, minTimestamp]);

  const selectionSummary = useMemo(() => {
    if (!contract && !selection) {
      return "Search for a collection to begin granting xTDH.";
    }

    const collectionLabel =
      contract?.name ?? contract?.symbol ?? contract?.address;

    if (!selection) {
      return collectionLabel
        ? `Collection selected: ${collectionLabel}. Choose token IDs to grant.`
        : "Choose token IDs to grant.";
    }

    if (selection.allSelected) {
      return collectionLabel
        ? `All tokens from ${collectionLabel} will receive a grant.`
        : "All tokens from the selected collection will receive a grant.";
    }

    const tokenCount = selection.tokenIdsRaw.length;
    return collectionLabel
      ? `${tokenCount} token${tokenCount === 1 ? "" : "s"} selected from ${collectionLabel}.`
      : `${tokenCount} token${tokenCount === 1 ? "" : "s"} selected.`;
  }, [contract, selection]);

  const validitySummary = useMemo(() => {
    if (neverExpires) {
      return "Grant never expires.";
    }
    return `Grant valid until ${formatDateTime(activeExpiry)}.`;
  }, [activeExpiry, neverExpires]);

  return (
    <div className="tw-flex tw-flex-col tw-gap-6">
      <div className="tw-bg-iron-950 tw-border tw-border-iron-800 tw-rounded-2xl tw-p-4 tw-space-y-2">
        <p className="tw-text-sm tw-text-iron-300 tw-m-0">{selectionSummary}</p>
        <p className="tw-text-xs tw-text-iron-400 tw-m-0">{validitySummary}</p>
      </div>

      <div className="tw-bg-iron-950 tw-border tw-border-iron-800 tw-rounded-2xl tw-p-4 tw-space-y-4">
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
          <h3 className="tw-text-sm tw-font-semibold tw-text-iron-100 tw-m-0">
            Validity
          </h3>
          <label className="tw-inline-flex tw-items-center tw-gap-2 tw-text-xs tw-font-medium tw-text-iron-200">
            <input
              type="checkbox"
              className="tw-h-4 tw-w-4 tw-rounded tw-border-iron-600 tw-bg-iron-900 focus:tw-ring-primary-400"
              checked={neverExpires}
              onChange={(event) => setNeverExpires(event.target.checked)}
            />
            Never expires
          </label>
        </div>

        {!neverExpires && (
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
            <CommonCalendar
              initialMonth={activeExpiry.getMonth()}
              initialYear={activeExpiry.getFullYear()}
              selectedTimestamp={activeExpiry.getTime()}
              minTimestamp={minTimestamp}
              maxTimestamp={null}
              setSelectedTimestamp={onCalendarSelect}
            />
            <TimePicker
              hours={validHours}
              minutes={validMinutes}
              onTimeChange={onTimeChange}
              minTime={timePickerMin}
            />
          </div>
        )}
      </div>

      <div className="tw-bg-iron-950 tw-border tw-border-iron-800 tw-rounded-2xl tw-p-4">
        <NftPicker
          onChange={setSelection}
          onContractChange={setContract}
          allowRanges
          allowAll
          hideSpam
          outputMode="number"
        />
      </div>
    </div>
  );
}
