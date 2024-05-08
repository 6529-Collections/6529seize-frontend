import { CreateProxyCreateDropToWaveAction } from "../../../../../../entities/IProxy";
import { ProfileProxyActionType } from "../../../../../../generated/models/ProfileProxyActionType";

export default function ProxyCreateActionConfigCreateDropToWave({
  endTime,
  onSubmit,
}: {
  readonly endTime: number | null;
  readonly onSubmit: (action: CreateProxyCreateDropToWaveAction) => void;
  }) {
  const handleSubmit = () =>
    onSubmit({
      action_type: ProfileProxyActionType.CreateDropToWave,
      end_time: endTime,
    });
  return <button onClick={handleSubmit}>SAVE</button>;
}