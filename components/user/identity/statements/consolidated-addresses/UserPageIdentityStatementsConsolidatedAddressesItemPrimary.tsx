import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";

export default function UserPageIdentityStatementsConsolidatedAddressesItemPrimary({
  isPrimary,
  canEdit,
  assignPrimary,
  isAssigningPrimary,
}: {
  readonly isPrimary: boolean;
  readonly canEdit: boolean;
  readonly assignPrimary: () => void;
  readonly isAssigningPrimary: boolean;
}) {
  if (isPrimary) {
    return (
      <span className="tw-text-[9px] tw-font-semibold tw-text-emerald-400 tw-bg-emerald-900/20 tw-px-1.5 tw-py-px tw-rounded tw-border tw-border-solid tw-border-emerald-500/20">
        Primary
      </span>
    );
  }

  if (canEdit) {
    return (
      <button
        disabled={isAssigningPrimary}
        onClick={assignPrimary}
        className="tw-bg-transparent tw-whitespace-nowrap tw-border-none tw-ml-1 tw-text-xs tw-font-medium tw-text-iron-300 hover:tw-text-primary-400 tw-transition tw-duration-300 tw-ease-out"
      >
        {isAssigningPrimary ? <CircleLoader /> : <>Set Primary</>}
      </button>
    );
  }

  return null;
}
