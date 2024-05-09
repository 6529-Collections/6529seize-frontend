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
    <div>

      <div>
        <p>Credit Amount</p>
        <CommonInput
          value={creditAmount.toString()}
          inputType="number"
          onChange={(newV) => setCreditAmount(parseInt(newV ?? "0"))}
          placeholder="Credit Amount"
        />
      </div>
      <button onClick={handleSubmit}>SAVE</button>
    </div>
  );
}
