import { useRef, useState } from "react";
import { PERIOD_LABELS } from "../../../../../helpers/Helpers";
import { Period } from "../../../../../helpers/Types";
import CreateWaveDatesEndDateSelectPeriodItem from "./CreateWaveDatesEndDateSelectPeriodItem";
import { AnimatePresence, motion } from "framer-motion";
import { useClickAway, useKeyPressEvent } from "react-use";

export default function CreateWaveDatesEndDateSelectPeriod({
  activePeriod,
  onPeriodSelect,
}: {
  readonly activePeriod: Period | null;
  readonly onPeriodSelect: (period: Period) => void;
}) {
  const label = activePeriod ? PERIOD_LABELS[activePeriod] : "Choose period";
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  useClickAway(listRef, (e) => {
    if (e.target !== buttonRef.current) {
      setIsOpen(false);
    }
  });
  useKeyPressEvent("Escape", () => setIsOpen(false));

  const onPeriod = (period: Period) => {
    setIsOpen(false);
    onPeriodSelect(period);
  };
  return (
    <div className="tw-relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className="tw-w-full tw-flex tw-items-center tw-text-left tw-relative tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-py-3 tw-pl-10 tw-pr-10 tw-bg-iron-800 lg:tw-bg-iron-900 tw-font-semibold tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-600 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base hover:tw-bg-iron-800 focus:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out tw-justify-between"
      >
        <span
          className={
            activePeriod
              ? "tw-text-primary-400"
              : "tw-text-iron-500 tw-font-medium"
          }
        >
          {label}
        </span>
      </button>
      <div className="tw-pointer-events-none tw-absolute tw-flex tw-items-center tw-inset-y-0 tw-pl-3">
        <svg
          className={`tw-w-5 tw-h-5 tw-flex-shrink-0 ${
            activePeriod ? "tw-text-primary-400" : "tw-text-iron-300"
          }`}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M21 10H3M16 2V6M8 2V6M7.8 22H16.2C17.8802 22 18.7202 22 19.362 21.673C19.9265 21.3854 20.3854 20.9265 20.673 20.362C21 19.7202 21 18.8802 21 17.2V8.8C21 7.11984 21 6.27976 20.673 5.63803C20.3854 5.07354 19.9265 4.6146 19.362 4.32698C18.7202 4 17.8802 4 16.2 4H7.8C6.11984 4 5.27976 4 4.63803 4.32698C4.07354 4.6146 3.6146 5.07354 3.32698 5.63803C3 6.27976 3 7.11984 3 8.8V17.2C3 18.8802 3 19.7202 3.32698 20.362C3.6146 20.9265 4.07354 21.3854 4.63803 21.673C5.27976 22 6.11984 22 7.8 22Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-3.5">
        <svg
          className={`${
            isOpen ? "-tw-rotate-180" : "tw-rotate-0"
          } tw-h-5 tw-w-5 tw-text-white tw-flex-shrink-0`}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 9L12 15L18 9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
        </svg>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {isOpen && (
          <motion.div
            className="tw-z-10 tw-rounded-lg tw-shadow-xl tw-bg-iron-800 tw-ring-1 tw-ring-black tw-ring-opacity-5"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div
              ref={listRef}
              className="tw-absolute tw-z-10 tw-mt-1.5 tw-overflow-hidden tw-w-full tw-rounded-md tw-bg-iron-800 tw-shadow-2xl tw-ring-1 tw-ring-white/10"
            >
              <div className="tw-py-1 tw-flow-root tw-overflow-x-hidden tw-overflow-y-auto">
                <ul className="tw-flex tw-flex-col tw-px-2 tw-mx-0 tw-mb-0 tw-list-none">
                  {Object.values(Period).map((period) => (
                    <CreateWaveDatesEndDateSelectPeriodItem
                      key={period}
                      period={period}
                      activePeriod={activePeriod}
                      onPeriodSelect={onPeriod}
                    />
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
