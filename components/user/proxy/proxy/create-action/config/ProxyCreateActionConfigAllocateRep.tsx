import { useEffect, useState } from "react";
import { CreateProxyAllocateRepAction } from "../../../../../../entities/IProxy";
import { ProfileProxyActionType } from "../../../../../../generated/models/ProfileProxyActionType";
import CommonInput from "../../../../../utils/input/CommonInput";
import CommonGroupSearch from "../../../../../utils/group/CommonGroupSearch";
import { ProfileProxyAction } from "../../../../../../generated/models/ProfileProxyAction";
import CommonRepCategorySearch from "../../../../../utils/rep/CommonRepCategorySearch";

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
  const [creditCategory, setCreditCategory] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const disabledCategories = repActions.map(
    (a) => a.action_data.credit_category
  );

  const getActionErrorMessage = (): string | null => {
    if (!repActions.length) {
      return null;
    }
    if (
      !creditCategory &&
      repActions.some((a) => !a.action_data.credit_category)
    ) {
      return "You have already Rep actions without credit category, please select category";
    }

    if (
      creditCategory &&
      repActions.some((a) => a.action_data.credit_category === creditCategory)
    ) {
      return "You have already Rep actions with this category";
    }

    return null;
  };

  const [error, setError] = useState<string | null>(getActionErrorMessage());
  useEffect(() => {
    setError(getActionErrorMessage());
  }, [creditAmount, creditCategory]);

  const handleSubmit = () =>
    onSubmit({
      action_type: ProfileProxyActionType.AllocateRep,
      end_time: endTime,
      credit_amount: creditAmount,
      credit_category: creditCategory,
      group_id: groupId,
    });
  return (
    <div>
      {error && <div>{error}</div>}
      <div>
        <p>Credit Amount</p>
        <CommonInput
          value={creditAmount.toString()}
          inputType="number"
          onChange={(newV) => setCreditAmount(parseInt(newV ?? "0"))}
          placeholder="Credit Amount"
        />
      </div>
      <div>
        <CommonRepCategorySearch
          category={creditCategory}
          disabledCategories={disabledCategories}
          setCategory={setCreditCategory}
        />
      </div>
      <div>
        <CommonGroupSearch onGroupSelect={(group) => setGroupId(group.id)} />
      </div>
      <button onClick={handleSubmit}>SAVE</button>
    </div>
  );
}
