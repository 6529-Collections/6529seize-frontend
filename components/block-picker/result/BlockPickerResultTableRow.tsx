"use client";

import type { PredictBlockNumbersResponseApiModel } from "@/app/tools/block-finder/page.client";
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
        className={`tw-group tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-900/70 ${
          showModal ? "" : "tw-cursor-pointer"
        }`}
      >
        <td className="tw-w-px tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-center tw-align-baseline tw-text-sm tw-font-medium tw-text-iron-100">
          {predictedBlock.blockNumberIncludes}
        </td>
        <td className="tw-w-px tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-center tw-align-baseline tw-text-sm tw-font-medium tw-text-iron-100">
          {predictedBlock.count}
        </td>
        <td className="tw-w-full tw-whitespace-normal tw-break-words tw-px-4 tw-py-3 tw-text-left tw-text-sm tw-font-medium tw-text-iron-100">
          {predictedBlock.blockNumbers.join(", ")}
        </td>
        <td className="tw-w-[28px] tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-center tw-align-baseline">
          <FontAwesomeIcon
            className="tw-text-iron-400 tw-transition-colors group-hover:tw-text-iron-200"
            icon={faMagnifyingGlass}
            height={18}
          />
        </td>
      </tr>
      <AllowlistToolCommonModalWrapper
        showModal={showModal}
        onClose={() => setShowModal(false)}
        title={`Block includes: ${predictedBlock.blockNumberIncludes}`}
        modalSize={AllowlistToolModalSize.X_LARGE}
        showTitle={false}
      >
        <BlockPickerResultTableRowModal predictedBlock={predictedBlock} />
      </AllowlistToolCommonModalWrapper>
    </>
  );
}
