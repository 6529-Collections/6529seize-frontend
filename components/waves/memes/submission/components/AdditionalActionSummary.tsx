"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t, type MessageKey } from "@/i18n/messages";
import { useId } from "react";
import { ADDITIONAL_ACTION_PLAN_MAX_LENGTH } from "../utils/submissionMetadata";
import type { DropMetadataState } from "@/components/waves/drop/useSingleWaveDropData";

interface AdditionalActionSummaryProps {
  readonly isAdditionalActionPromised: boolean;
  readonly plan?: string | undefined;
  readonly metadataState?: DropMetadataState | undefined;
}

export function AdditionalActionSummary({
  isAdditionalActionPromised,
  plan,
  metadataState,
}: AdditionalActionSummaryProps) {
  const locale = useBrowserLocale();
  const headingId = useId();
  const savedPlan = isAdditionalActionPromised ? (plan?.trim() ?? "") : "";
  const unavailableState =
    isAdditionalActionPromised && !savedPlan ? metadataState : undefined;
  let messageKey: MessageKey = isAdditionalActionPromised
    ? "memes.additionalAction.noPlan"
    : "memes.additionalAction.noAction";
  if (unavailableState?.status === "error") {
    messageKey = "memes.additionalAction.loadError";
  } else if (unavailableState?.status === "loading") {
    messageKey = "memes.additionalAction.loading";
  }

  return (
    <section
      aria-labelledby={headingId}
      className="tw-min-w-0 tw-space-y-2 tw-rounded-lg tw-bg-iron-900/70 tw-p-4 tw-ring-1 tw-ring-iron-800"
    >
      <h3
        id={headingId}
        className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100"
      >
        {t(locale, "memes.additionalAction.label")}
      </h3>
      <p className="tw-m-0 tw-whitespace-pre-wrap tw-break-words tw-text-sm tw-leading-relaxed tw-text-iron-300">
        {savedPlan || t(locale, messageKey)}
      </p>
      {unavailableState?.status === "error" && (
        <button
          type="button"
          onClick={unavailableState.retry}
          className="tw-min-h-11 tw-rounded-lg tw-bg-iron-800 tw-px-3 tw-text-sm tw-font-medium tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          {t(locale, "memes.additionalAction.retry")}
        </button>
      )}
      {isAdditionalActionPromised && (
        <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
          {t(locale, "memes.additionalAction.declaration")}
        </p>
      )}
      {savedPlan.length > ADDITIONAL_ACTION_PLAN_MAX_LENGTH && (
        <p role="alert" className="tw-m-0 tw-text-sm tw-text-red">
          {t(locale, "memes.additionalAction.tooLong", {
            limit: formatInteger(locale, ADDITIONAL_ACTION_PLAN_MAX_LENGTH),
          })}
        </p>
      )}
    </section>
  );
}
