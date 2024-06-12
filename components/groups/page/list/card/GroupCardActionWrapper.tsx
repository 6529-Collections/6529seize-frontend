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
            <p className="tw-mb-0 tw-text-base tw-text-iron-100 tw-font-semibold">
              Rep Progress
            </p>
            <p className="tw-mt-1 tw-text-iron-400 tw-text-sm">Lorem ipsum dolor sit amet consectetur adipisicing elit.</p>
            <p className="tw-mt-4 tw-mb-0 tw-text-xl tw-text-primary-400 tw-font-bold">
              {doneMembersCount}/{membersCount}
            </p>
            <div className="tw-mt-2 tw-w-full tw-bg-iron-700 tw-rounded-full tw-h-3">
              <div className="tw-w-1/3 tw-bg-primary-400 tw-h-3 tw-rounded-full"></div>
            </div>
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
