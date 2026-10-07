import { CreditDirection } from "../GroupCard";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function GroupCardActionCreditDirection({
  creditDirection,
  setCreditDirection,
}: {
  readonly creditDirection: CreditDirection;
  readonly setCreditDirection: (creditDirection: CreditDirection) => void;
}) {
  const locale = useBrowserLocale();
  const activeClasses = "tw-border-iron-400 tw-bg-iron-800 tw-text-iron-50";

  const inactiveClasses =
    "tw-border-iron-700 tw-bg-iron-900 tw-text-iron-400 desktop-hover:hover:tw-bg-iron-800";

  return (
    <div className="tw-flex tw-gap-1.5">
      <button
        onClick={() => setCreditDirection(CreditDirection.SUBTRACT)}
        type="button"
        title={t(locale, "network.groupInspection.subtract")}
        aria-label={t(locale, "network.groupInspection.subtract")}
        aria-pressed={creditDirection === CreditDirection.SUBTRACT}
        className={`${
          creditDirection === CreditDirection.SUBTRACT
            ? activeClasses
            : inactiveClasses
        } tw-flex tw-size-11 tw-shrink-0 tw-touch-manipulation tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-text-base tw-font-semibold tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-300 motion-reduce:tw-transition-none`}
      >
        <svg
          className="tw-size-4 tw-flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 12H19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        onClick={() => setCreditDirection(CreditDirection.ADD)}
        type="button"
        title={t(locale, "network.groupInspection.add")}
        aria-label={t(locale, "network.groupInspection.add")}
        aria-pressed={creditDirection === CreditDirection.ADD}
        className={`${
          creditDirection === CreditDirection.ADD
            ? activeClasses
            : inactiveClasses
        } tw-flex tw-size-11 tw-shrink-0 tw-touch-manipulation tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-text-base tw-font-semibold tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-300 motion-reduce:tw-transition-none`}
      >
        <svg
          className="tw-size-4 tw-flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 5V19M5 12H19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
