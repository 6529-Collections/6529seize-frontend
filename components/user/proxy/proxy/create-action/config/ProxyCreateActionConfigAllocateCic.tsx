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
    <div className="md:tw-flex md:tw-items-end tw-gap-3">
      <div className="tw-w-full md:tw-w-auto">
        <span className="tw-block tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-300">
          Credit Amount
        </span>
        <div className="tw-mt-1.5 tw-w-full md:tw-w-40">
          <CommonInput
            value={creditAmount.toString()}
            inputType="number"
            onChange={(newV) => setCreditAmount(parseInt(newV ?? "0"))}
            placeholder="Credit Amount"
            theme="light"
          />
        </div>
      </div>
      <div className="tw-mt-4 md:tw-mt-0 tw-flex tw-items-center tw-justify-end md:tw-justify-start tw-gap-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="tw-w-full sm:tw-w-auto tw-flex tw-items-center tw-justify-center tw-relative tw-bg-iron-800 tw-px-3.5 tw-py-2.5 tw-text-sm tw-leading-5 tw-font-semibold tw-text-iron-300 tw-border tw-border-solid tw-border-iron-700 tw-rounded-lg hover:tw-bg-iron-700 tw-transition tw-duration-300 tw-ease-out"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={handleSubmit}
          className={`${
            disabled
              ? "tw-opacity-50"
              : "hover:tw-bg-primary-600 hover:tw-border-primary-600"
          } tw-w-full sm:tw-w-auto tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-leading-5 tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out`}
        >
          Save
        </button>
      </div>
    </div>
  );
}
