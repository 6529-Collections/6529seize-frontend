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
        className="tw-w-full tw-text-left tw-relative tw-block tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-py-2.5 tw-pl-3.5 tw-pr-10 tw-bg-iron-800 lg:tw-bg-iron-900 tw-text-iron-300 tw-font-semibold tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-600 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base hover:tw-bg-iron-800 focus:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out tw-justify-between"
      >
        <span className="tw-text-iron-500 tw-font-medium">{label}</span>
      </button>
      <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center -tw-mr-1 tw-pr-3.5">
        <svg
          className="tw-h-5 tw-w-5 tw-text-white"
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
            className="tw-z-10 tw-mt-1 tw-rounded-lg tw-shadow-xl tw-bg-iron-800 tw-ring-1 tw-ring-black tw-ring-opacity-5"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div
              ref={listRef}
              className="tw-absolute tw-z-10 tw-mt-1 tw-overflow-hidden tw-w-full tw-rounded-md tw-bg-iron-800 tw-shadow-2xl tw-ring-1 tw-ring-white/10"
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
