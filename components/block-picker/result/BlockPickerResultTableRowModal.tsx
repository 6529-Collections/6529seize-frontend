import { PredictBlockNumbersResponseApiModel } from "@/app/tools/block-finder/page.client";
import BlockPickerAdvancedItemBlock from "../advanced/BlockPickerAdvancedItemBlock";

export default function BlockPickerResultTableRowModal({
  predictedBlock,
}: {
  predictedBlock: PredictBlockNumbersResponseApiModel;
}) {
  return (
    <div className="tw-rounded-lg tw-overflow-hidden">
      <div className="tw-p-6 tw-max-h-[calc(100vh_+_-100px)] tw-overflow-y-auto">
        <div>
          <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-neutral-100">
            {predictedBlock.count === 1 ? `Block` : `Blocks`} that{" "}
            {predictedBlock.count === 1 ? `includes` : `include`}{" "}
            {predictedBlock.blockNumberIncludes}
          </p>
          <p className="tw-mb-0 tw-text-sm tw-font-normal tw-text-neutral-400">
            Total: {predictedBlock.count}
          </p>
        </div>
        <div className="tw-mt-4 tw-space-y-0.5">
          {predictedBlock.blockNumbers.map((block: number) => (
            <div key={block} className="tw-text-base tw-font-normal">
              <BlockPickerAdvancedItemBlock
                key={block}
                block={block}
                blockParts={predictedBlock.blockNumberIncludes}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
