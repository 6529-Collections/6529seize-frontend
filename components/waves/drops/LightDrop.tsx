import { FC } from "react";
import { ApiLightDrop } from "../../../generated/models/ApiLightDrop";

export interface LightDropProps {
  readonly drop: ApiLightDrop;
}

const LightDrop: FC<LightDropProps> = ({ drop }) => {
  return <div className="tw-h-12"></div>;
};

export default LightDrop;
