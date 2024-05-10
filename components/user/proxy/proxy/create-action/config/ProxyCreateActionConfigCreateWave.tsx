import { CreateProxyCreateWaveAction } from "../../../../../../entities/IProxy";
import { ProfileProxyActionType } from "../../../../../../generated/models/ProfileProxyActionType";

export default function ProxyCreateActionConfigCreateWave({
  endTime,
  onSubmit,
}: {
  readonly endTime: number | null;
  readonly onSubmit: (action: CreateProxyCreateWaveAction) => void;
}) {
  const handleSubmit = () =>
    onSubmit({
      action_type: ProfileProxyActionType.CreateWave,
      end_time: endTime,
    });
  return (
    <button
      type="button"
      onClick={handleSubmit}
      className="tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-leading-5 tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
    >
      Save
    </button>
  );
}
