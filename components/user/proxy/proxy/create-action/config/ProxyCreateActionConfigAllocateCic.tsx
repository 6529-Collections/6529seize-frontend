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
      <button onClick={handleSubmit}>SAVE</button>
    </div>
  );
}
