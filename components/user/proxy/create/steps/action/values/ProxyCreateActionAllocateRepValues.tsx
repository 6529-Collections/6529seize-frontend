import { useState } from "react";
import CommonInput from "../../../../../../utils/input/CommonInput";

export default function ProxyCreateActionAllocateRepValues() {
  const [amount, setAmount] = useState<number | null>(null); // [1]
  return (
    <div>
      <div className="tw-w-40">
        <CommonInput
          placeholder="Amount"
          inputType="number"
          value={amount?.toString() ?? ""}
          onChange={(v) => setAmount(v ? Number(v) : null)}
        />
      </div>
    </div>
  );
}
