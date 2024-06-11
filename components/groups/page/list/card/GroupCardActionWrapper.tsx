import GroupCardActionFooter from "./utils/GroupCardActionFooter";

export default function GroupCardActionWrapper({
  loading,
  disabled,
  addingRates,
  doneMembersCount,
  membersCount,
  onSave,
  onCancel,
  children,
}: {
  readonly loading: boolean;
  readonly disabled: boolean;
  readonly addingRates: boolean;
  readonly membersCount: number | null;
  readonly doneMembersCount: number | null;
  readonly onSave: () => void;
  readonly onCancel: () => void;

  readonly children: React.ReactNode;
}) {
  return (
    <div className="tw-py-4 tw-flex tw-flex-col tw-h-full tw-gap-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-700 tw-relative">
      <div className="tw-px-4 sm:tw-px-6">
        {addingRates ? (
          <div>
            {doneMembersCount}/{membersCount}
          </div>
        ) : (
          children
        )}
      </div>
      <GroupCardActionFooter
        onCancel={onCancel}
        loading={loading}
        disabled={disabled}
        onSave={onSave}
      />
    </div>
  );
}
