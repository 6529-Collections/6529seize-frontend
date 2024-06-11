import { GroupFull } from "../../../../../../generated/models/GroupFull";
import RepCategorySearch, {
  RepCategorySearchSize,
} from "../../../../../utils/input/rep-category/RepCategorySearch";
import GroupCardActionNumberInput from "../utils/GroupCardActionNumberInput";

export default function GroupCardRepAllInputs({
  group,
  amountToGive,
  category,
  setCategory,
  setAmountToGive,
}: {
  readonly group: GroupFull;
  readonly amountToGive: number | null;
  readonly category: string | null;
  readonly setCategory: (category: string | null) => void;
  readonly setAmountToGive: (amountToGive: number | null) => void;
}) {
  return (
    <div className="tw-flex tw-flex-wrap sm:tw-flex-nowrap tw-gap-x-4 tw-gap-y-4">
      <GroupCardActionNumberInput
        label="Rep"
        componentId={`${group.id}_rep`}
        amount={amountToGive}
        setAmount={setAmountToGive}
      />
      <RepCategorySearch
        category={category}
        setCategory={setCategory}
        size={RepCategorySearchSize.SM}
      />
    </div>
  );
}
