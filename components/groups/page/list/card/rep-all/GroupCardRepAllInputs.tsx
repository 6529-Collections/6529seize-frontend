import { GroupFull } from "../../../../../../generated/models/GroupFull";
import RepCategorySearch, {
  RepCategorySearchSize,
} from "../../../../../utils/input/rep-category/RepCategorySearch";
import { CreditDirection } from "../GroupCard";
import GroupCardActionNumberInput from "../utils/GroupCardActionNumberInput";

export default function GroupCardRepAllInputs({
  group,
  amountToAdd,
  category,
  creditDirection,
  setCategory,
  setAmountToAdd,
  setCreditDirection,
}: {
  readonly group: GroupFull;
  readonly amountToAdd: number | null;
  readonly category: string | null;
  readonly creditDirection: CreditDirection;
  readonly setCategory: (category: string | null) => void;
  readonly setAmountToAdd: (amountToGive: number | null) => void;
  readonly setCreditDirection: (creditDirection: CreditDirection) => void;
}) {
  return (
    <div className="tw-w-full tw-flex tw-flex-wrap sm:tw-flex-nowrap tw-gap-x-4 tw-gap-y-4">
      <div className="tw-w-full md:tw-w-[58%]">
        <GroupCardActionNumberInput
          label="Rep"
          componentId={`${group.id}_rep`}
          amount={amountToAdd}
          creditDirection={creditDirection}
          setCreditDirection={setCreditDirection}
          setAmount={setAmountToAdd}
        />
      </div>
      <div className="tw-w-full md:tw-w-[42%]">
        <RepCategorySearch
          category={category}
          setCategory={setCategory}
          size={RepCategorySearchSize.SM}
        />
      </div>
    </div>
  );
}
