import type { CreditDirection } from "../GroupCard";
import GroupCardActionCreditDirection from "./GroupCardActionCreditDirection";

export default function GroupCardActionNumberInput({
  label,
  componentId,
  amount,
  creditDirection,
  setAmount,
  setCreditDirection,
}: {
  readonly label: string;
  readonly componentId: string;
  readonly amount: number | null;
  readonly creditDirection: CreditDirection;
  readonly setAmount: (cicToGive: number | null) => void;
  readonly setCreditDirection: (creditDirection: CreditDirection) => void;
}) {
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setAmount(null);
      return;
    }
    const numberAmount = parseInt(value);
    if (isNaN(numberAmount)) {
      setAmount(null);
      return;
    }
    if (numberAmount < 0) {
      setAmount(0);
      return;
    }
    setAmount(numberAmount);
  };
  return (
    <div>
      <label
        htmlFor={componentId}
        className="tw-mb-2 tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-400"
      >
        {label}
      </label>
      <div className="tw-flex tw-w-full tw-items-center tw-gap-2">
        <GroupCardActionCreditDirection
          creditDirection={creditDirection}
          setCreditDirection={setCreditDirection}
        />
        <div className="tw-relative tw-min-w-0 tw-flex-1">
          <input
            type="number"
            id={componentId}
            min={0}
            value={amount ?? ""}
            onChange={onChange}
            autoComplete="off"
            className="tw-form-input tw-block tw-h-[46px] tw-w-full tw-min-w-0 tw-touch-manipulation tw-appearance-none tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-lg tw-font-medium tw-tabular-nums tw-text-iron-100 tw-caret-iron-100 tw-ring-1 tw-ring-inset tw-ring-iron-700/60 tw-transition-colors tw-duration-150 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-iron-300 desktop-hover:hover:tw-ring-iron-700 motion-reduce:tw-transition-none"
          />
        </div>
      </div>
    </div>
  );
}
