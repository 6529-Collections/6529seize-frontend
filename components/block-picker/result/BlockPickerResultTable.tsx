import { PredictBlockNumbersResponseApiModel } from "../../../pages/meme-blocks";
import BlockPickerResultTableHeader from "./BlockPickerResultTableHeader";
import BlockPickerResultTableRow from "./BlockPickerResultTableRow";

export default function BlockPickerResultTable({
  predictedBlocks,
}: {
  predictedBlocks: PredictBlockNumbersResponseApiModel[];
}) {
  return (
    <div className="tw-mt-4 tw-flow-root">
      <div className="tw-overflow-x-auto tw-ring-1 tw-ring-white/10 tw-rounded-lg">
        <table className="tw-min-w-full tw-divide-y tw-divide-neutral-700/60">
          <BlockPickerResultTableHeader />
          <tbody className="tw-divide-y tw-divide-solid tw-divide-neutral-700/60">
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
