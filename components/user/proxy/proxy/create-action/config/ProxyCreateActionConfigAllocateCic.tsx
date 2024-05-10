import { useState } from "react";
import { CreateProxyAllocateCicAction } from "../../../../../../entities/IProxy";
import { ProfileProxyActionType } from "../../../../../../generated/models/ProfileProxyActionType";

export default function ProxyCreateActionConfigAllocateCic({
  endTime,
  onSubmit,
}: {
  readonly endTime: number | null;
  readonly onSubmit: (action: CreateProxyAllocateCicAction) => void;
}) {
  const [creditAmount, setCreditAmount] = useState<number>(0);

  const handleSubmit = () =>
    onSubmit({
      action_type: ProfileProxyActionType.AllocateCic,
      end_time: endTime,
      credit_amount: creditAmount,
    });

  return (
    <div>
      <div>Credit amount: {creditAmount}</div>
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
