import Countdown from "@/components/distribution-plan-tool/common/Countdown";
import { BlockPickerAdvancedItemBlockLink } from "../advanced/BlockPickerAdvancedItemBlock";

export default function BlockPickerResultHeader({
  timestamp,
  blocknumber,
}: {
  timestamp: number;
  blocknumber: number;
}) {
  return (
    <div className="tw-mt-8 tw-pt-6 tw-border-t tw-border-solid tw-border-x-0 tw-border-b-0 tw-border-iron-700">
      <div className="sm:tw-flex sm:tw-items-baseline sm:tw-justify-between">
        <div className="tw-inline-flex tw-items-center tw-space-x-2">
          <div className="tw-space-x-1">
            <span className="tw-text-base tw-text-lg tw-text-white tw-font-semibold">
              <BlockPickerAdvancedItemBlockLink
                block={blocknumber}
                blockParts={[blocknumber.toString()]}
              />
            </span>
            <span className="tw-mt-0.5 tw-text-iron-300">
              is the closest predicted block to{" "}
              {new Date(timestamp).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "numeric",
                second: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
      <div className="tw-mt-1 tw-text-sm tw-text-white tw-font-semibold">
        <Countdown timestamp={timestamp} />
      </div>
    </div>
  );
}
