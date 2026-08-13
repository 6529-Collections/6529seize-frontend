import PrimaryButton from "@/components/utils/button/PrimaryButton";
import SecondaryButton from "@/components/utils/button/SecondaryButton";

interface NftPickerActionsProps {
  canAddTokens: boolean;
  allowAll: boolean;
  selectedContract: boolean;
  variant: "card" | "flat";
  selectAllLabel: string;
  onSelectAll: () => void;
  onAdd: () => void;
}

export function NftPickerActions({
  canAddTokens,
  allowAll,
  selectedContract,
  variant,
  selectAllLabel,
  onSelectAll,
  onAdd,
}: NftPickerActionsProps) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-center">
      <PrimaryButton
        onClicked={onAdd}
        loading={false}
        disabled={!canAddTokens}
        size={variant === "flat" ? "lg" : "default"}
      >
        Add
      </PrimaryButton>
      {allowAll && (
        <SecondaryButton
          onClicked={onSelectAll}
          disabled={!selectedContract}
          className="tw-w-full sm:tw-w-auto"
        >
          {selectAllLabel}
        </SecondaryButton>
      )}
    </div>
  );
}
