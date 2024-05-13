import { useEffect, useState } from "react";
import { CreateProxyAllocateCicAction } from "../../../../../../entities/IProxy";
import { ProfileProxyActionType } from "../../../../../../generated/models/ProfileProxyActionType";
import CommonInput from "../../../../../utils/input/CommonInput";

export default function ProxyCreateActionConfigAllocateCic({
  endTime,
  onSubmit,
  onCancel,
}: {
  readonly endTime: number | null;
  readonly onSubmit: (action: CreateProxyAllocateCicAction) => void;
  readonly onCancel: () => void;
}) {
  const [creditAmount, setCreditAmount] = useState<number>(0);

  const handleSubmit = () =>
    onSubmit({
      action_type: ProfileProxyActionType.AllocateCic,
      end_time: endTime,
      credit_amount: creditAmount,
    });

  const [disabled, setDisabled] = useState(true);
  useEffect(() => setDisabled(creditAmount <= 0), [creditAmount]);

  return (
    <div className="tw-max-w-xs tw-flex tw-items-end tw-gap-x-3">
      <div className="tw-w-full">
        <p className="tw-mb-0">
          <span className="tw-block tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-400">
            Credit Amount
          </span>
        </p>
        <div className="tw-mt-1.5 tw-w-40">
          <CommonInput
            value={creditAmount.toString()}
            inputType="number"
            onChange={(newV) => setCreditAmount(parseInt(newV ?? "0"))}
            placeholder="Credit Amount"
          />
        </div>
      </div>
      <div className="tw-mt-2 tw-flex tw-items-center tw-gap-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="tw-flex tw-items-center tw-justify-center tw-relative tw-bg-iron-800 tw-px-3.5 tw-py-2.5 tw-text-sm tw-leading-5 tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-iron-700 tw-rounded-lg hover:tw-bg-iron-700 tw-transition tw-duration-300 tw-ease-out"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={handleSubmit}
          className={`${
            disabled ? "tw-opacity-50" : ""
          } tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-leading-5 tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out`}
        >
          Save
        </button>
      </div>
    </div>
  );
}
