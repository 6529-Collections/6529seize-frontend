"use client";

import { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays } from "@fortawesome/free-regular-svg-icons";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import CommonCalendar from "@/components/utils/calendar/CommonCalendar";
import type { CreateWaveDatesConfig } from "@/types/waves.types";
import TooltipIconButton from "@/components/common/TooltipIconButton";
import { Time } from "@/helpers/time";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getEarliestApproveWaveEndTimestamp } from "./approveWaveDates.helpers";
import { CREATE_WAVE_FORM_STYLES } from "../utils/createWaveFormStyles";

interface CreateWaveDatesApproveStartProps {
  readonly dates: CreateWaveDatesConfig;
  readonly setDates: (dates: CreateWaveDatesConfig) => void;
}

const formatShortDate = (timestamp: number, locale: SupportedLocale) =>
  new Date(timestamp).toLocaleString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export default function CreateWaveDatesApproveStart({
  dates,
  setDates,
}: CreateWaveDatesApproveStartProps) {
  const locale = useBrowserLocale();
  const minStartTimestamp = Time.currentMillis();
  const startDateFormatted = useMemo(
    () => formatShortDate(dates.submissionStartDate, locale),
    [dates.submissionStartDate, locale]
  );

  const handleStartDateChange = (timestamp: number) => {
    const adjustedTimestamp = Math.max(timestamp, Time.currentMillis());
    const earliestEndTimestamp =
      getEarliestApproveWaveEndTimestamp(adjustedTimestamp);
    const selectedEndDate =
      dates.endDate !== null && Number.isFinite(dates.endDate)
        ? dates.endDate
        : null;
    const nextEndDate =
      selectedEndDate !== null && selectedEndDate < earliestEndTimestamp
        ? earliestEndTimestamp
        : selectedEndDate;

    setDates({
      ...dates,
      submissionStartDate: adjustedTimestamp,
      votingStartDate: adjustedTimestamp,
      endDate: nextEndDate,
    });
  };

  return (
    <section className="tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900/60 tw-p-5 tw-shadow-sm">
      <div className="tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-start sm:tw-justify-between">
        <div className="tw-space-y-1">
          <div className="tw-flex tw-items-center tw-gap-x-2">
            <h3 className={CREATE_WAVE_FORM_STYLES.sectionTitle}>
              {t(locale, "waves.create.dates.approve.start.title")}
            </h3>
            <TooltipIconButton
              icon={faInfoCircle}
              tooltipText={t(
                locale,
                "waves.create.dates.approve.start.tooltip"
              )}
              tooltipPosition="bottom"
              tooltipWidth="tw-w-80"
              aria-label={t(
                locale,
                "waves.create.dates.approve.start.infoLabel"
              )}
              className="tw-flex tw-size-6 tw-shrink-0 tw-items-center tw-justify-center tw-leading-none"
            />
          </div>
          <p className={CREATE_WAVE_FORM_STYLES.compactSupportingText}>
            {t(locale, "waves.create.dates.approve.start.description")}
          </p>
        </div>

        <div className="tw-flex tw-items-center tw-rounded-lg tw-bg-iron-700/40 tw-px-3 tw-py-2 tw-shadow-md tw-transition-transform tw-duration-200 hover:tw-translate-y-[-1px]">
          <FontAwesomeIcon
            icon={faCalendarDays}
            className="tw-mr-2 tw-size-4 tw-text-primary-400"
          />
          <div>
            <p className="tw-m-0 tw-text-xs tw-text-iron-300/70">
              {t(locale, "waves.create.dates.approve.start.summaryLabel")}
            </p>
            <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-50">
              {startDateFormatted}
            </p>
          </div>
        </div>
      </div>

      <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-x-10 md:tw-grid-cols-2">
        <div className="tw-w-full">
          <CommonCalendar
            initialMonth={new Date().getMonth()}
            initialYear={new Date().getFullYear()}
            selectedTimestamp={dates.submissionStartDate}
            minTimestamp={minStartTimestamp}
            maxTimestamp={null}
            setSelectedTimestamp={handleStartDateChange}
            variant="flat"
          />
        </div>
      </div>
    </section>
  );
}
