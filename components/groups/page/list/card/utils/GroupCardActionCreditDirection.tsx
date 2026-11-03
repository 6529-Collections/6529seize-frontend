import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import Button from "@/components/utils/button/Button";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";

import { CreditDirection } from "../GroupCard";

export default function GroupCardActionCreditDirection({
  creditDirection,
  setCreditDirection,
  compact = false,
}: {
  readonly creditDirection: CreditDirection;
  readonly setCreditDirection: (creditDirection: CreditDirection) => void;
  readonly compact?: boolean | undefined;
}) {
  const locale = useBrowserLocale();
  const addLabel = t(locale, "network.groupInspection.add");
  const subtractLabel = t(locale, "network.groupInspection.subtract");
  if (compact) {
    return (
      <div className="tw-flex tw-gap-x-2">
        <Button
          variant="negativeToggle"
          size="xs"
          className="tw-w-8 !tw-p-0"
          title={subtractLabel}
          aria-label={subtractLabel}
          aria-pressed={creditDirection === CreditDirection.SUBTRACT}
          onClick={() => setCreditDirection(CreditDirection.SUBTRACT)}
        >
          <MinusIcon className="tw-size-4" aria-hidden="true" />
        </Button>
        <Button
          variant="positiveToggle"
          size="xs"
          className="tw-w-8 !tw-p-0"
          title={addLabel}
          aria-label={addLabel}
          aria-pressed={creditDirection === CreditDirection.ADD}
          onClick={() => setCreditDirection(CreditDirection.ADD)}
        >
          <PlusIcon className="tw-size-4" aria-hidden="true" />
        </Button>
      </div>
    );
  }

  const activeClasses: Record<CreditDirection, string> = {
    [CreditDirection.ADD]: "tw-border-green tw-text-green",
    [CreditDirection.SUBTRACT]: "tw-border-red tw-text-red",
  };

  const inactiveClasses =
    "hover:tw-bg-iron-800 tw-border-iron-650 tw-text-iron-400";

  return (
    <div className="tw-flex tw-gap-x-2">
      <button
        onClick={() => setCreditDirection(CreditDirection.SUBTRACT)}
        type="button"
        title={subtractLabel}
        className={`${
          creditDirection === CreditDirection.SUBTRACT
            ? activeClasses[CreditDirection.SUBTRACT]
            : inactiveClasses
        } tw-flex tw-h-8 tw-w-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-bg-iron-900 tw-text-base tw-font-semibold tw-shadow-sm tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700`}
      >
        <svg
          className="tw-size-4 tw-flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
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
        title={addLabel}
        className={`${
          creditDirection === CreditDirection.ADD
            ? activeClasses[CreditDirection.ADD]
            : inactiveClasses
        } tw-flex tw-h-8 tw-w-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-bg-iron-900 tw-text-base tw-font-semibold tw-shadow-sm tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700`}
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
