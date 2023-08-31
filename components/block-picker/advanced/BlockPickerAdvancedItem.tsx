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
  const [showModal, setShowModal] = useState(true);

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
        <div className="tw-rounded-lg tw-overflow-hidden">
          <div className="tw-p-6 tw-max-h-[calc(100vh_+_-100px)] tw-overflow-y-auto">
            <div>
              <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-neutral-100">
                Title
              </p>
              <p className="tw-mb-0 tw-text-sm tw-font-normal tw-text-neutral-400">
                Lorem ipsum dolor sit amet consectetur.
              </p>
            </div>
            <div className="tw-mt-4">
              {item.blockNumbers.map((block) => (
                <div key={block} className="tw-text-base tw-font-normal">
                  <BlockPickerAdvancedItemBlock
                    key={block}
                    block={block}
                    blockParts={item.blockNumberIncludes}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </AllowlistToolCommonModalWrapper>
    </>
  );
}
