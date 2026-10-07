import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { ApiRateMatter } from "@/generated/models/ApiRateMatter";
import RepCategorySearch from "@/components/utils/input/rep-category/RepCategorySearch";
import type { CreditDirection } from "../GroupCard";
import type { GroupCardRateMatter } from "../GroupCard";
import GroupCardActionNumberInput from "../utils/GroupCardActionNumberInput";

import type { JSX } from "react";

export default function GroupCardVoteAllInputs({
  matter,
  group,
  amountToAdd,
  category,
  creditDirection,
  setCategory,
  setAmountToAdd,
  setCreditDirection,
}: {
  readonly matter: GroupCardRateMatter;
  readonly group: ApiGroupFull;
  readonly amountToAdd: number | null;
  readonly category: string | null;
  readonly creditDirection: CreditDirection;
  readonly setCategory: (category: string | null) => void;
  readonly setAmountToAdd: (amountToGive: number | null) => void;
  readonly setCreditDirection: (creditDirection: CreditDirection) => void;
}) {
  const components: Record<GroupCardRateMatter, JSX.Element> = {
    [ApiRateMatter.Cic]: (
      <div className="tw-w-full">
        <GroupCardActionNumberInput
          label="NIC"
          componentId={`${group.id}_nic`}
          amount={amountToAdd}
          creditDirection={creditDirection}
          setCreditDirection={setCreditDirection}
          setAmount={setAmountToAdd}
        />
      </div>
    ),
    [ApiRateMatter.Rep]: (
      <div className="tw-flex tw-w-full tw-flex-col tw-gap-5">
        <div className="tw-w-full">
          <GroupCardActionNumberInput
            label="REP"
            componentId={`${group.id}_rep`}
            amount={amountToAdd}
            creditDirection={creditDirection}
            setCreditDirection={setCreditDirection}
            setAmount={setAmountToAdd}
          />
        </div>
        <div className="tw-w-full">
          <RepCategorySearch
            category={category}
            setCategory={setCategory}
            variant="form"
          />
        </div>
      </div>
    ),
  };

  return components[matter];
}
