import { RadioGroup } from "@headlessui/react";
import { ProxyActionType } from "../../../../../../../entities/IProxy";
import ProxyCreateActionSelectTypeItem from "./ProxyCreateActionSelectTypeItem";

const ACTION_TYPE_LABEL: Record<ProxyActionType, string> = {
  [ProxyActionType.ALLOCATE_REP]: "Allocate Reputation",
  [ProxyActionType.ALLOCATE_REP_WITH_CATEGORY]:
    "Allocate Reputation with Category",
  [ProxyActionType.ALLOCATE_CIC]: "Allocate CIC",
  [ProxyActionType.CREATE_WAVE]: "Create Wave",
  [ProxyActionType.READ_WAVE]: "Read Wave",
  [ProxyActionType.CREATE_DROP_TO_WAVE]: "Create Drop to Wave",
  [ProxyActionType.RATE_WAVE_DROP]: "Rate Wave Drop",
};

export default function ProxyCreateActionSelectType({
  selectedActionType,
  setSelectedActionType,
}: {
  readonly selectedActionType: ProxyActionType;
  readonly setSelectedActionType: (targetType: ProxyActionType) => void;
}) {
  const actionTypes = Object.values(ProxyActionType).map((t) => ({
    label: ACTION_TYPE_LABEL[t],
    value: t,
  }));

  return (
    <div className="tw-inline-flex tw-rounded-lg tw-overflow-hidden">
      {actionTypes.map((action) => (
        <ProxyCreateActionSelectTypeItem
          key={action.value}
          selectedActionType={selectedActionType}
          action={action}
          setSelectedActionType={setSelectedActionType}
        />
      ))}
    </div>
  );
}
