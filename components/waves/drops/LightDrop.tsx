import { FC } from "react";
import { ApiLightDrop } from "@/generated/models/ApiLightDrop";

interface LightDropProps {
  readonly drop: ApiLightDrop;
}

const LightDrop: FC<LightDropProps> = ({ drop }) => {
  return (
    <div className="tw-flex tw-flex-col tw-w-full tw-p-3 tw-gap-2 tw-border-b tw-border-iron-800">
      <div className="tw-flex tw-items-center tw-gap-2">
        <div className="tw-w-8 tw-h-8 tw-rounded-full tw-bg-iron-800" />
        <div className="tw-flex tw-flex-col tw-gap-1">
          <div className="tw-w-24 tw-h-3 tw-rounded tw-bg-iron-800" />
          <div className="tw-w-16 tw-h-2 tw-rounded tw-bg-iron-800" />
        </div>
      </div>
      <div className="tw-flex tw-flex-col tw-gap-1">
        <div className="tw-w-full tw-h-3 tw-rounded tw-bg-iron-800" />
        <div className="tw-w-3/4 tw-h-3 tw-rounded tw-bg-iron-800" />
      </div>
      <div className="tw-flex tw-justify-between tw-mt-1">
        <div className="tw-w-20 tw-h-2 tw-rounded tw-bg-iron-800" />
        <div className="tw-w-12 tw-h-2 tw-rounded tw-bg-iron-800" />
      </div>
    </div>
  );
};

export default LightDrop;
