import type { CreateProxyRateWaveDropAction } from "@/entities/IProxy";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";
import Button from "@/components/utils/button/Button";

export default function ProxyCreateActionConfigRateWaveDrop({
  endTime,
  onSubmit,
  onCancel,
}: {
  readonly endTime: number | null;
  readonly onSubmit: (action: CreateProxyRateWaveDropAction) => void;
  readonly onCancel: () => void;
}) {
  const handleSubmit = () =>
    onSubmit({
      action_type: ApiProfileProxyActionType.RateWaveDrop,
      end_time: endTime,
    });
  return (
    <div className="tw-flex tw-items-center tw-justify-end md:tw-justify-start tw-gap-x-3">
      <Button
        variant="secondary"
        size="md"
        onClick={onCancel}
        fullWidth
        className="sm:tw-w-auto"
      >
        Cancel
      </Button>
      <Button
        variant="action"
        size="md"
        onClick={handleSubmit}
        fullWidth
        className="sm:tw-w-auto"
      >
        Save
      </Button>
    </div>
  );
}
