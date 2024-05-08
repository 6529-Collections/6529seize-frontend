import { CreateProxyRateWaveDropAction } from "../../../../../../entities/IProxy";
import { ProfileProxyActionType } from "../../../../../../generated/models/ProfileProxyActionType";

export default function ProxyCreateActionConfigRateWaveDrop({
  endTime,
  onSubmit,
}: {
  readonly endTime: number | null;
  readonly onSubmit: (action: CreateProxyRateWaveDropAction) => void;
}) {
  const handleSubmit = () =>
    onSubmit({
      action_type: ProfileProxyActionType.RateWaveDrop,
      end_time: endTime,
    });
  return <button onClick={handleSubmit}>SAVE</button>;
}
