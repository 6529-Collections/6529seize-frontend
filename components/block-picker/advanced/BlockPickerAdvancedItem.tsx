import { useState } from "react";
import AllowlistToolCommonModalWrapper, {
  AllowlistToolModalSize,
} from "../../allowlist-tool/common/modals/AllowlistToolCommonModalWrapper";

import BlockPickerAdvancedItemBlock from "./BlockPickerAdvancedItemBlock";
import { PredictBlockNumbersResponseApiModel } from "../../../pages/block-picker";

export default function BlockPickerAdvanced({
  item,
}: {
  item: PredictBlockNumbersResponseApiModel;
}) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div onClick={() => setShowModal(true)}>
        <div>Block includes: {item.blockNumberIncludes}</div>
        <div>Count: {item.count}</div>
      </div>
      <AllowlistToolCommonModalWrapper
        showModal={showModal}
        onClose={() => setShowModal(false)}
        title={`Block includes: ${item.blockNumberIncludes}`}
        modalSize={AllowlistToolModalSize.X_LARGE}
        showTitle={false}
      >
        <div>
          {item.blockNumbers.map((block) => (
            <div key={block}>
              <BlockPickerAdvancedItemBlock
                key={block}
                block={block}
                blockParts={item.blockNumberIncludes}
              />
            </div>
          ))}
        </div>
      </AllowlistToolCommonModalWrapper>
    </>
  );
}
