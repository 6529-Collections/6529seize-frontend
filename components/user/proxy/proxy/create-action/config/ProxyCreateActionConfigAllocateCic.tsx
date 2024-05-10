import { useState } from "react";
import { CreateProxyAllocateCicAction } from "../../../../../../entities/IProxy";
import { ProfileProxyActionType } from "../../../../../../generated/models/ProfileProxyActionType";

export default function ProxyCreateActionConfigAllocateCic({
  endTime,
  onSubmit,
  onCancel,
}: {
  readonly endTime: number | null;
  readonly onSubmit: (action: CreateProxyAllocateCicAction) => void;
  readonly onCancel: () => void;
}) {
  const [creditAmount, setCreditAmount] = useState<number>(25);

  const handleSubmit = () =>
    onSubmit({
      action_type: ProfileProxyActionType.AllocateCic,
      end_time: endTime,
      credit_amount: creditAmount,
    });

  return (
    <div>
      <p className="tw-mb-0 tw-space-x-1">
        <span className="tw-text-iron-300 tw-text-base tw-font-medium">
          Credit amount:
        </span>
        <span className="tw-text-iron-50 tw-font-medium">{creditAmount}</span>
      </p>
      <div className="tw-mt-2 tw-flex tw-items-center tw-gap-x-3">
        <button
          type="button"
          onClick={handleSubmit}
          className="tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-leading-5 tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="tw-flex tw-items-center tw-justify-center tw-relative tw-bg-iron-800 tw-px-3.5 tw-py-2.5 tw-text-sm tw-leading-5 tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-iron-700 tw-rounded-lg hover:tw-bg-iron-700 tw-transition tw-duration-300 tw-ease-out"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
