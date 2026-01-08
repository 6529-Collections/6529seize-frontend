import type { CreateProxyReadWaveAction } from "@/entities/IProxy";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";

export default function ProxyCreateActionConfigReadWave({
  endTime,
  onSubmit,
  onCancel,
}: {
  readonly endTime: number | null;
  readonly onSubmit: (action: CreateProxyReadWaveAction) => void;
  readonly onCancel: () => void;
}) {
  const handleSubmit = () =>
    onSubmit({
      action_type: ApiProfileProxyActionType.ReadWave,
      end_time: endTime,
    });
  return (
    <div className="tw-flex tw-items-center tw-justify-end md:tw-justify-start tw-gap-x-3">
      <button
        type="button"
        onClick={onCancel}
        className="tw-w-full sm:tw-w-auto tw-flex tw-items-center tw-justify-center tw-relative tw-bg-iron-800 tw-px-3.5 tw-py-2.5 tw-text-sm tw-leading-5 tw-font-semibold tw-text-iron-300 tw-border tw-border-solid tw-border-iron-700 tw-rounded-lg hover:tw-bg-iron-700 tw-transition tw-duration-300 tw-ease-out"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSubmit}
        className="tw-w-full sm:tw-w-auto tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-leading-5 tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
      >
        Save
      </button>
    </div>
  );
}
