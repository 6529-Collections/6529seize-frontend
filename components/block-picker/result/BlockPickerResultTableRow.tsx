import { useState } from "react";
import { PredictBlockNumbersResponseApiModel } from "../../../pages/block-picker";
import AllowlistToolCommonModalWrapper, {
  AllowlistToolModalSize,
} from "../../allowlist-tool/common/modals/AllowlistToolCommonModalWrapper";
import BlockPickerResultTableRowModal from "./BlockPickerResultTableRowModal";

export default function BlockPickerResultTableRow({
  predictedBlock,
}: {
  predictedBlock: PredictBlockNumbersResponseApiModel;
}) {
  const [showModal, setShowModal] = useState(false);
  return (
    <tr
      onClick={() => setShowModal(true)}
      className={`hover:tw-bg-neutral-800/60 tw-transition tw-duration-300 tw-ease-out ${showModal ? '' : 'tw-cursor-pointer'}`}
    >
      <td className="tw-whitespace-nowrap tw-py-4 tw-pl-4 tw-pr-3 tw-text-xs tw-font-medium tw-text-white sm:tw-pl-6">
        {predictedBlock.blockNumberIncludes}
      </td>
      <td className="tw-whitespace-nowrap tw-py-4 tw-pl-3 tw-pr-4 tw-text-xs tw-font-medium tw-text-white sm:tw-pr-6">
        {predictedBlock.count}
      </td>
      <AllowlistToolCommonModalWrapper
        showModal={showModal}
        onClose={() => setShowModal(false)}
        title={`Block includes: ${predictedBlock.blockNumberIncludes}`}
        modalSize={AllowlistToolModalSize.X_LARGE}
        showTitle={false}
      >
        <BlockPickerResultTableRowModal predictedBlock={predictedBlock} />
      </AllowlistToolCommonModalWrapper>
    </tr>
  );
}
