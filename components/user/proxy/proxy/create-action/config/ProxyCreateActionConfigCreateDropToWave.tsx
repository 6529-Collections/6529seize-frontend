import { CreateProxyCreateDropToWaveAction } from "../../../../../../entities/IProxy";
import { ProfileProxyActionType } from "../../../../../../generated/models/ProfileProxyActionType";

export default function ProxyCreateActionConfigCreateDropToWave({
  endTime,
  onSubmit,
  onCancel,
}: {
  readonly endTime: number | null;
  readonly onSubmit: (action: CreateProxyCreateDropToWaveAction) => void;
  readonly onCancel: () => void;
}) {
  const handleSubmit = () =>
    onSubmit({
      action_type: ProfileProxyActionType.CreateDropToWave,
      end_time: endTime,
    });
  return (
    <div className="tw-flex tw-items-center tw-gap-x-3">
      <button
        type="button"
        onClick={handleSubmit}
        className="tw-bg-primary-500 tw-px-3 tw-py-2 tw-text-sm tw-leading-5 tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
      >
        Save
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="tw-flex tw-items-center tw-justify-center tw-relative tw-bg-iron-800 tw-px-3.5 tw-py-2.5 tw-text-sm tw-leading-5 tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-iron-700 tw-rounded-lg hover:tw-bg-iron-700 tw-transition tw-duration-300 tw-ease-out"
      >
        Cancel
      </button>
    </div>
  );
}
