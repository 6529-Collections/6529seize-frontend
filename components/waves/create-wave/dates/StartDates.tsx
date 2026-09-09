"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays } from "@fortawesome/free-regular-svg-icons";
import CommonCalendar from "@/components/utils/calendar/CommonCalendar";
import type { CreateWaveDatesConfig } from "@/types/waves.types";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { Time } from "@/helpers/time";
import CollapsibleCard from "@/components/common/CollapsibleCard";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { CREATE_WAVE_FORM_STYLES } from "../utils/createWaveFormStyles";

interface StartDatesProps {
  readonly waveType: ApiWaveType;
  readonly dates: CreateWaveDatesConfig;
  readonly setDates: (dates: CreateWaveDatesConfig) => void;
  readonly isExpanded: boolean;
  readonly setIsExpanded: (expanded: boolean) => void;
}

export default function StartDates({
  waveType,
  dates,
  setDates,
  isExpanded,
  setIsExpanded,
}: StartDatesProps) {
  const locale = useBrowserLocale();
  const isRankWave = waveType === ApiWaveType.Rank;
  const minStartTimestamp = Time.currentMillis();
  const minVotingTimestamp = isRankWave
    ? Math.max(dates.submissionStartDate, minStartTimestamp)
    : null;

  const handleSubmissionDateChange = (timestamp: number) => {
    const adjustedTimestamp = Math.max(timestamp, Time.currentMillis());
    setDates({
      ...dates,
      submissionStartDate: adjustedTimestamp,
      votingStartDate: isRankWave
        ? Math.max(dates.votingStartDate, adjustedTimestamp)
        : adjustedTimestamp,
    });
  };

  const handleVotingDateChange = (timestamp: number) => {
    setDates({
      ...dates,
      votingStartDate: Math.max(timestamp, dates.submissionStartDate),
    });
  };

  const formatShortDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const submissionDateFormatted = formatShortDate(dates.submissionStartDate);
  const votingDateFormatted = formatShortDate(dates.votingStartDate);

  return (
    <CollapsibleCard
      title={
        <span className="tw-text-iron-100">
          {t(locale, "waves.create.dates.rank.timeline.title")}
        </span>
      }
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      collapsedContent={
        <span className="tw-flex tw-items-center tw-space-x-4">
          <span className="tw-flex tw-items-center tw-rounded-lg tw-bg-iron-700/40 tw-px-3 tw-py-2 tw-shadow-md tw-transition-transform tw-duration-200 hover:tw-translate-y-[-1px]">
            <FontAwesomeIcon
              icon={faCalendarDays}
              className="tw-mr-2 tw-size-4 tw-text-primary-400"
            />
            <span className="tw-block">
              <span className="tw-block tw-text-xs tw-text-iron-300/70">
                {t(locale, "waves.create.dates.rank.timeline.submissionLabel")}
              </span>
              <span className="tw-block tw-text-sm tw-font-medium tw-text-iron-50">
                {submissionDateFormatted}
              </span>
            </span>
          </span>
          {isRankWave && (
            <span className="tw-flex tw-items-center tw-rounded-lg tw-bg-iron-700/40 tw-px-3 tw-py-2 tw-shadow-md tw-transition-transform tw-duration-200 hover:tw-translate-y-[-1px]">
              <FontAwesomeIcon
                icon={faCalendarDays}
                className="tw-mr-2 tw-size-4 tw-text-primary-400"
              />
              <span className="tw-block">
                <span className="tw-block tw-text-xs tw-text-iron-300/70">
                  {t(locale, "waves.create.dates.rank.timeline.votingLabel")}
                </span>
                <span className="tw-block tw-text-sm tw-font-medium tw-text-iron-50">
                  {votingDateFormatted}
                </span>
              </span>
            </span>
          )}
        </span>
      }
    >
      {/* Calendar Selection */}
      <div className="tw-grid tw-grid-cols-1 tw-gap-x-10 tw-gap-y-8 tw-px-5 tw-pb-5 tw-pt-2 md:tw-grid-cols-2">
        <div className="tw-col-span-1">
          <h3 className={CREATE_WAVE_FORM_STYLES.sectionTitle}>
            {t(locale, "waves.create.dates.rank.timeline.submissionLabel")}
          </h3>
          <p
            className={`tw-mt-1 ${CREATE_WAVE_FORM_STYLES.compactSupportingText}`}
          >
            {t(
              locale,
              "waves.create.dates.rank.timeline.submissionDescription"
            )}
          </p>
          <div className="tw-mt-4">
            <CommonCalendar
              initialMonth={new Date().getMonth()}
              initialYear={new Date().getFullYear()}
              selectedTimestamp={dates.submissionStartDate}
              minTimestamp={minStartTimestamp}
              maxTimestamp={null}
              setSelectedTimestamp={handleSubmissionDateChange}
              variant="flat"
            />
          </div>
        </div>

        {isRankWave && (
          <div className="tw-col-span-1">
            <h3 className={CREATE_WAVE_FORM_STYLES.sectionTitle}>
              {t(locale, "waves.create.dates.rank.timeline.votingLabel")}
            </h3>
            <p
              className={`tw-mt-1 ${CREATE_WAVE_FORM_STYLES.compactSupportingText}`}
            >
              {t(locale, "waves.create.dates.rank.timeline.votingDescription")}
            </p>
            <div className="tw-mt-4">
              <CommonCalendar
                initialMonth={new Date().getMonth()}
                initialYear={new Date().getFullYear()}
                selectedTimestamp={dates.votingStartDate}
                minTimestamp={minVotingTimestamp}
                maxTimestamp={null}
                setSelectedTimestamp={handleVotingDateChange}
                variant="flat"
              />
            </div>
          </div>
        )}
      </div>
    </CollapsibleCard>
  );
}
