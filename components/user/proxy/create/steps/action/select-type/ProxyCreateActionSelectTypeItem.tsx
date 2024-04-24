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
        isActive
          ? "tw-bg-iron-800 tw-text-iron-100"
          : "tw-text-iron-500 tw-bg-iron-950 hover:tw-bg-iron-900 hover:tw-text-iron-100 tw-font-medium"
      } tw-px-4 tw-py-2 tw-whitespace-nowrap tw-font-semibold tw-text-sm tw-border tw-border-solid tw-border-iron-700 tw-transition tw-duration-300 tw-ease-out  `}
      onClick={() => setSelectedActionType(action.value)}
    >
      {action.label}
    </button>
  );
}
