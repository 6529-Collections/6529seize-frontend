import { useState } from "react";
import { CreateProxyAllocateRepAction } from "../../../../../../entities/IProxy";
import { ProfileProxyActionType } from "../../../../../../generated/models/ProfileProxyActionType";
import CommonInput from "../../../../../utils/input/CommonInput";
import { ProfileProxyAction } from "../../../../../../generated/models/ProfileProxyAction";

export default function ProxyCreateActionConfigAllocateRep({
  endTime,
  repActions,
  onSubmit,
}: {
  readonly endTime: number | null;
  readonly repActions: ProfileProxyAction[];
  readonly onSubmit: (action: CreateProxyAllocateRepAction) => void;
}) {
  const [creditAmount, setCreditAmount] = useState<number>(0);

  const handleSubmit = () =>
    onSubmit({
      action_type: ProfileProxyActionType.AllocateRep,
      end_time: endTime,
      credit_amount: creditAmount,
    });
  return (
    <div className="tw-max-w-xs tw-flex tw-items-end tw-gap-x-3">
      <div className="tw-w-full">
        <p className="tw-mb-0">
          <span className="tw-text-iron-300 tw-text-sm tw-font-medium">
            Credit Amount
          </span>
        </p>
        <div className="tw-mt-1">
          <CommonInput
            value={creditAmount.toString()}
            inputType="number"
            onChange={(newV) => setCreditAmount(parseInt(newV ?? "0"))}
            placeholder="Credit Amount"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        className="tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-leading-5 tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
      >
        Save
      </button>
    </div>
  );
}