import { PredictBlockNumbersResponseApiModel } from "@/app/meme-blocks/page.client";
import BlockPickerResultHeader from "./BlockPickerResultHeader";
import BlockPickerResultTable from "./BlockPickerResultTable";

export default function BlockPickerResult({
  blocknumber,
  timestamp,
  predictedBlocks,
}: {
  blocknumber: number;
  timestamp: number;
  predictedBlocks: PredictBlockNumbersResponseApiModel[];
}) {
  return (
    <div>
      <BlockPickerResultHeader
        blocknumber={blocknumber}
        timestamp={timestamp}
      />
      {!!predictedBlocks.length && (
        <BlockPickerResultTable predictedBlocks={predictedBlocks} />
      )}
    </div>
  );
}
