import { PredictBlockNumbersResponseApiModel } from "@/app/tools/block-finder/page.client";
import BlockPickerResultHeader from "./BlockPickerResultHeader";
import BlockPickerResultTable from "./BlockPickerResultTable";

export default function BlockPickerResult({
  blocknumber,
  timestamp,
  predictedBlocks,
}: {
  blocknumber?: number;
  timestamp?: number;
  predictedBlocks: PredictBlockNumbersResponseApiModel[];
}) {
  return (
    <div>
      {!!blocknumber && !!timestamp && (
        <BlockPickerResultHeader
          blocknumber={blocknumber}
          timestamp={timestamp}
        />
      )}
      {!!predictedBlocks.length && (
        <BlockPickerResultTable predictedBlocks={predictedBlocks} />
      )}
    </div>
  );
}
