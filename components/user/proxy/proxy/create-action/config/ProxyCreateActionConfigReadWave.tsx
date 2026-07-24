import type { CreateProxyReadWaveAction } from "@/entities/IProxy";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";
import Button from "@/components/utils/button/Button";

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
