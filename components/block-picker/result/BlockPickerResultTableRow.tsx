"use client";

import { PredictBlockNumbersResponseApiModel } from "@/app/tools/block-finder/page.client";
import AllowlistToolCommonModalWrapper, {
    AllowlistToolModalSize,
} from "@/components/allowlist-tool/common/modals/AllowlistToolCommonModalWrapper";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import BlockPickerResultTableRowModal from "./BlockPickerResultTableRowModal";

export default function BlockPickerResultTableRow({
  predictedBlock,
}: {
  predictedBlock: PredictBlockNumbersResponseApiModel;
}) {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <tr
        onClick={() => setShowModal(true)}
        className={`tw-group hover:tw-bg-iron-800/60 tw-transition tw-duration-300 tw-ease-out ${
          showModal ? "" : "tw-cursor-pointer"
        }`}>
        <td className="tw-align-baseline tw-w-px tw-whitespace-nowrap tw-py-3 tw-px-4 tw-text-sm tw-font-medium tw-text-white tw-text-center">
          {predictedBlock.blockNumberIncludes}
        </td>
        <td className="tw-align-baseline tw-w-px tw-whitespace-nowrap tw-py-3 tw-px-4 tw-text-sm tw-font-medium tw-text-white tw-text-center">
          {predictedBlock.count}
        </td>
        <td className="tw-w-full tw-whitespace-normal tw-break-words tw-py-3 tw-px-4 tw-text-sm tw-font-medium tw-text-white tw-text-left">
          {predictedBlock.blockNumbers.join(", ")}
        </td>
        <td className="tw-align-baseline tw-w-[28px] tw-whitespace-nowrap tw-py-3 tw-px-4 tw-text-center">
          <FontAwesomeIcon icon={faMagnifyingGlass} height={18} />
        </td>
      </tr>
      <AllowlistToolCommonModalWrapper
        showModal={showModal}
        onClose={() => setShowModal(false)}
        title={`Block includes: ${predictedBlock.blockNumberIncludes}`}
        modalSize={AllowlistToolModalSize.X_LARGE}
        showTitle={false}>
        <BlockPickerResultTableRowModal predictedBlock={predictedBlock} />
      </AllowlistToolCommonModalWrapper>
    </>
  );
}
