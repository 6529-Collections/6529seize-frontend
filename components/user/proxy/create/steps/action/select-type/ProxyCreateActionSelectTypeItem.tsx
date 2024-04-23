import { ProxyActionType } from "../../../../../../../entities/IProxy";

export default function ProxyCreateActionSelectTypeItem({
  selectedActionType,
  action,
  setSelectedActionType,
}: {
  readonly selectedActionType: ProxyActionType;
  readonly action: {
    readonly label: string;
    readonly value: ProxyActionType;
  };
  readonly setSelectedActionType: (targetType: ProxyActionType) => void;
}) {
  const isActive = selectedActionType === action.value;
  return (
    <button
      className={`${
        isActive ? "tw-bg-blue-900" : "tw-bg-transparent"
      } tw-border-1`}
      onClick={() => setSelectedActionType(action.value)}
    >
      {action.label}
    </button>
  );
}
