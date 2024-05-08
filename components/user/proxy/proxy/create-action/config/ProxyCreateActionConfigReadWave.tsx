import { CreateProxyReadWaveAction } from "../../../../../../entities/IProxy";
import { ProfileProxyActionType } from "../../../../../../generated/models/ProfileProxyActionType";

export default function ProxyCreateActionConfigReadWave({
  endTime,
  onSubmit,
}: {
  readonly endTime: number | null;
  readonly onSubmit: (action: CreateProxyReadWaveAction) => void;
  }) {
  const handleSubmit = () =>
    onSubmit({
      action_type: ProfileProxyActionType.ReadWave,
      end_time: endTime,
    });
  return <button onClick={handleSubmit}>SAVE</button>;
}
