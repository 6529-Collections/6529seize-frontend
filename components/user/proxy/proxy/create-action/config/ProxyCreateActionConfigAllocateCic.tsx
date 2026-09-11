"use client";

import { useEffect, useState } from "react";
import type { CreateProxyAllocateCicAction } from "@/entities/IProxy";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";
import CommonInput from "@/components/utils/input/CommonInput";
import Button from "@/components/utils/button/Button";

export default function ProxyCreateActionConfigAllocateCic({
  endTime,
  submitting,
  onSubmit,
  onCancel,
}: {
  readonly endTime: number | null;
  readonly submitting: boolean;
  readonly onSubmit: (action: CreateProxyAllocateCicAction) => void;
  readonly onCancel: () => void;
}) {
  const [creditAmount, setCreditAmount] = useState<number>(0);

  const handleSubmit = () =>
    onSubmit({
      action_type: ApiProfileProxyActionType.AllocateCic,
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
        <Button
          variant="secondary"
          size="md"
          onClick={onCancel}
          disabled={submitting}
          fullWidth
          className="sm:tw-w-auto"
        >
          Cancel
        </Button>
        <Button
          variant="action"
          size="md"
          disabled={disabled}
          loading={submitting}
          onClick={handleSubmit}
          fullWidth
          className="sm:tw-w-auto"
        >
          Save
        </Button>
      </div>
    </div>
  );
}
