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
  const [groupId, setGroupId] = useState<string | null>(null);

  const handleSubmit = () =>
    onSubmit({
      action_type: ProfileProxyActionType.AllocateCic,
      end_time: endTime,
      credit_amount: creditAmount,
      group_id: groupId,
    });

  return (
    <div>
      <div>Credit amount: {creditAmount}</div>
      <div>Group Id: {groupId}</div>
      <button onClick={handleSubmit}>SAVE</button>
    </div>
  );
}
