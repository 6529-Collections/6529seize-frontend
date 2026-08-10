"use client";

import type { CreateWaveDatesConfig } from "@/types/waves.types";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import CreateWaveDatesApprove from "./CreateWaveDatesApprove";
import CreateWaveDatesRank from "./CreateWaveDatesRank";
import type { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import CreateWaveAdvancedSection from "../utils/CreateWaveAdvancedSection";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { getDefaultFirstDecisionTime } from "../services/waveDecisionService";
import { Time } from "@/helpers/time";

interface CreateWaveDatesProps {
  readonly waveType: ApiWaveType;
  readonly dates: CreateWaveDatesConfig;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly setDates: (dates: CreateWaveDatesConfig) => void;
}

export default function CreateWaveDates({
  waveType,
  dates,
  errors,
  setDates,
}: CreateWaveDatesProps) {
  const locale = useBrowserLocale();
  const formatDateTime = (timestamp: number) =>
    new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(timestamp);
  const startsInFuture =
    dates.submissionStartDate > Time.currentMillis() + 5 * 60 * 1000;
  const startsTogether =
    dates.submissionStartDate === dates.votingStartDate;
  const expectedFirstDecisionTime = getDefaultFirstDecisionTime(
    dates.votingStartDate
  );
  const usesDefaultFirstDecisionTime =
    Math.abs(dates.firstDecisionTime - expectedFirstDecisionTime) < 60 * 1000;
  const isApprove = waveType === ApiWaveType.Approve;
  const isCustomized = isApprove
    ? !startsTogether || startsInFuture || dates.endDate !== null
    : !startsTogether ||
      startsInFuture ||
      (!dates.ongoingRanking && !usesDefaultFirstDecisionTime) ||
      dates.subsequentDecisions.length > 0 ||
      dates.isRolling;

  let summary: string;
  if (isApprove) {
    summary =
      dates.endDate === null
        ? t(locale, "waves.create.dates.approve.noEndSummary", {
            start: formatDateTime(dates.submissionStartDate),
          })
        : t(locale, "waves.create.dates.approve.endSummary", {
            start: formatDateTime(dates.submissionStartDate),
            end: formatDateTime(dates.endDate),
          });
  } else if (dates.ongoingRanking) {
    summary = t(locale, "waves.create.dates.rank.ongoingSummary", {
      submission: formatDateTime(dates.submissionStartDate),
      voting: formatDateTime(dates.votingStartDate),
    });
  } else {
    summary = t(locale, "waves.create.dates.rank.scheduledSummary", {
      submission: formatDateTime(dates.submissionStartDate),
      voting: formatDateTime(dates.votingStartDate),
      announcement: formatDateTime(dates.firstDecisionTime),
    });
  }

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-6">
      <div>
        <h2 className="tw-mb-1 tw-text-xl tw-font-semibold tw-text-white">
          {t(locale, "waves.create.dates.title")}
        </h2>
        <p className="tw-mb-0 tw-text-sm tw-leading-relaxed tw-text-iron-400">
          {t(locale, "waves.create.dates.description")}
        </p>
      </div>
      <CreateWaveAdvancedSection
        summary={summary}
        isCustomized={isCustomized}
        hasError={errors.length > 0}
      >
        {isApprove ? (
          <CreateWaveDatesApprove
            dates={dates}
            errors={errors}
            setDates={setDates}
          />
        ) : (
          <CreateWaveDatesRank
            waveType={waveType}
            dates={dates}
            errors={errors}
            setDates={setDates}
          />
        )}
      </CreateWaveAdvancedSection>
    </div>
  );
}
