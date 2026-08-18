import type { PredictBlockNumbersResponseApiModel } from "@/app/tools/block-finder/page.client";
import BlockPickerResultTableHeader from "./BlockPickerResultTableHeader";
import BlockPickerResultTableRow from "./BlockPickerResultTableRow";

export default function BlockPickerResultTable({
  predictedBlocks,
}: {
  predictedBlocks: PredictBlockNumbersResponseApiModel[];
}) {
  return (
    <div className="tw-mt-4 tw-flow-root">
      <div className="tw-overflow-x-auto tw-rounded-lg tw-ring-1 tw-ring-iron-800">
        <table className="tw-min-w-full tw-divide-y tw-divide-iron-800">
          <BlockPickerResultTableHeader />
          <tbody className="tw-divide-y tw-divide-solid tw-divide-iron-800">
            {predictedBlocks.map((block) => (
              <BlockPickerResultTableRow
                key={block.blockNumberIncludes}
                predictedBlock={block}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
