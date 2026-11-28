"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import type { ValidatorBadgeData } from "./ValidatorBadge";

interface ValidatorDetailsPanelProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly profileHandle: string | null;
  readonly validator: ValidatorBadgeData;
}

const VALIDATOR_ABOUT_URL = "https://6529.io/validator";

/**
 * Formats a protocol cycle day as a human-readable date.
 * Protocol days are sequential integers starting from a known epoch.
 * This is a simplified display - in production, this would convert
 * to an actual UTC date based on the protocol epoch.
 */
const formatCycleDay = (cycleDay: number): string => {
  // Display as "Day N" until we have proper epoch conversion
  return `Day ${cycleDay.toLocaleString()}`;
};

export const ValidatorDetailsPanel = ({
  isOpen,
  onClose,
  profileHandle,
  validator,
}: ValidatorDetailsPanelProps) => {
  const locale = useBrowserLocale();
  const isMobile = useIsMobileDevice();

  const handleEscapeKey = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  const title = t(locale, "validator.details.title", {
    profile: profileHandle ?? t(locale, "validator.details.profileFallback"),
  });

  const hasQualifyingDays =
    validator.qualifyingDays !== null && validator.qualifyingDays !== undefined;
  const hasLastCycle =
    validator.lastQualifyingCycle !== null &&
    validator.lastQualifyingCycle !== undefined;
  const hasObservedThrough =
    validator.observedThroughCycle !== null &&
    validator.observedThroughCycle !== undefined;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="tw-relative tw-z-50"
        onClose={onClose}
        onKeyDown={handleEscapeKey}
      >
        <Transition.Child
          as={Fragment}
          enter="tw-ease-out tw-duration-300"
          enterFrom="tw-opacity-0"
          enterTo="tw-opacity-100"
          leave="tw-ease-in tw-duration-200"
          leaveFrom="tw-opacity-100"
          leaveTo="tw-opacity-0"
        >
          <div className="tw-fixed tw-inset-0 tw-bg-black/60" aria-hidden="true" />
        </Transition.Child>

        <div className="tw-fixed tw-inset-0 tw-overflow-y-auto">
          <div
            className={`tw-flex tw-min-h-full tw-items-center tw-justify-center ${
              isMobile ? "tw-items-end tw-p-0" : "tw-p-4"
            }`}
          >
            <Transition.Child
              as={Fragment}
              enter="tw-ease-out tw-duration-300"
              enterFrom={
                isMobile
                  ? "tw-opacity-0 tw-translate-y-full"
                  : "tw-opacity-0 tw-scale-95"
              }
              enterTo={
                isMobile ? "tw-opacity-100 tw-translate-y-0" : "tw-opacity-100 tw-scale-100"
              }
              leave="tw-ease-in tw-duration-200"
              leaveFrom={
                isMobile ? "tw-opacity-100 tw-translate-y-0" : "tw-opacity-100 tw-scale-100"
              }
              leaveTo={
                isMobile
                  ? "tw-opacity-0 tw-translate-y-full"
                  : "tw-opacity-0 tw-scale-95"
              }
            >
              <Dialog.Panel
                className={`tw-w-full tw-max-w-sm tw-transform tw-overflow-hidden tw-bg-iron-900 tw-text-left tw-align-middle tw-shadow-xl tw-transition-all ${
                  isMobile
                    ? "tw-rounded-t-2xl tw-rounded-b-none"
                    : "tw-rounded-xl"
                }`}
              >
                {/* Header */}
                <div className="tw-flex tw-items-center tw-justify-between tw-border-b tw-border-iron-700 tw-px-4 tw-py-3">
                  <Dialog.Title
                    as="h3"
                    className="tw-text-base tw-font-semibold tw-text-iron-100"
                  >
                    {title}
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label={t(locale, "validator.details.close")}
                    className="tw-rounded-full tw-p-1.5 tw-text-iron-400 tw-transition-colors hover:tw-bg-iron-800 hover:tw-text-iron-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                  >
                    <FontAwesomeIcon icon={faXmark} className="tw-size-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="tw-px-4 tw-py-4 tw-space-y-4">
                  {/* Status */}
                  <div className="tw-flex tw-items-center tw-gap-2">
                    <span className="tw-size-2 tw-rounded-full tw-bg-success" />
                    <span className="tw-text-sm tw-text-iron-200">
                      {t(locale, "validator.details.confirmed")}
                    </span>
                  </div>

                  {/* Details */}
                  <dl className="tw-space-y-2">
                    {hasLastCycle && (
                      <div className="tw-flex tw-justify-between tw-text-sm">
                        <dt className="tw-text-iron-400">
                          {t(locale, "validator.details.lastQualifying")}
                        </dt>
                        <dd className="tw-text-iron-200">
                          {formatCycleDay(validator.lastQualifyingCycle!)}
                        </dd>
                      </div>
                    )}
                    {hasQualifyingDays && (
                      <div className="tw-flex tw-justify-between tw-text-sm">
                        <dt className="tw-text-iron-400">
                          {t(locale, "validator.details.qualifyingDays")}
                        </dt>
                        <dd className="tw-text-iron-200">
                          {t(locale, "validator.details.daysCount", {
                            count: validator.qualifyingDays!,
                          })}
                        </dd>
                      </div>
                    )}
                    {hasObservedThrough && (
                      <div className="tw-flex tw-justify-between tw-text-sm">
                        <dt className="tw-text-iron-400">
                          {t(locale, "validator.details.dataThrough")}
                        </dt>
                        <dd className="tw-text-iron-200">
                          {formatCycleDay(validator.observedThroughCycle!)}
                        </dd>
                      </div>
                    )}
                  </dl>

                  {/* Learn more link */}
                  <a
                    href={VALIDATOR_ABOUT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tw-flex tw-items-center tw-gap-1.5 tw-text-sm tw-text-primary-400 tw-transition-colors hover:tw-text-primary-300"
                  >
                    {t(locale, "validator.details.learnMore")}
                    <FontAwesomeIcon
                      icon={faArrowUpRightFromSquare}
                      className="tw-size-3"
                    />
                  </a>
                </div>

                {/* Footer note about data source */}
                <div className="tw-border-t tw-border-iron-700 tw-px-4 tw-py-3">
                  <p className="tw-text-xs tw-text-iron-500">
                    {t(locale, "validator.details.dataNote")}
                  </p>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
