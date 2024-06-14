import { CreditDirection } from "../GroupCard";

export default function GroupCardActionCreditDirection({
  creditDirection,
  setCreditDirection,
}: {
  readonly creditDirection: CreditDirection;
  readonly setCreditDirection: (creditDirection: CreditDirection) => void;
}) {
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
        title="Subtract"
        className={`${
          creditDirection === CreditDirection.SUBTRACT
            ? activeClasses[CreditDirection.SUBTRACT]
            : inactiveClasses
        } tw-flex-shrink-0 tw-flex tw-items-center tw-justify-center tw-border tw-border-solid tw-rounded-lg tw-bg-iron-900 
          tw-w-8 tw-h-8 tw-text-base tw-font-semibold  tw-shadow-sm hover:tw-bg-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out`}
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
        title="Add"
        className={`${
          creditDirection === CreditDirection.ADD
            ? activeClasses[CreditDirection.ADD]
            : inactiveClasses
        } tw-flex-shrink-0 tw-flex tw-items-center tw-justify-center tw-border tw-border-solid tw-rounded-lg tw-bg-iron-900 
          tw-w-8 tw-h-8 tw-text-base tw-font-semibold  tw-shadow-sm hover:tw-bg-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out`}
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
