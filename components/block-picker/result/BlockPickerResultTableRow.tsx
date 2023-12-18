import { useState } from "react";
import { PredictBlockNumbersResponseApiModel } from "../../../pages/meme-blocks";
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
      className={`tw-group hover:tw-bg-neutral-800/60 tw-transition tw-duration-300 tw-ease-out ${
        showModal ? "" : "tw-cursor-pointer"
      }`}
    >
      <td className="tw-whitespace-nowrap tw-py-3.5 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-white sm:tw-pl-6">
        {predictedBlock.blockNumberIncludes}
      </td>
      <td className="tw-whitespace-nowrap tw-py-3.5 tw-pl-3 tw-pr-4 tw-text-sm tw-font-medium tw-text-white">
        {predictedBlock.count}
      </td>
      <td className="tw-text-right tw-pl-3 tw-pr-4 sm:tw-pr-6">
        <div>
          <svg
            className="tw-h-5 tw-w-5 tw-text-neutral-400 group-hover:tw-text-white tw-transition tw-duration-300 tw-ease-out"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M21 9L21 3M21 3H15M21 3L13 11M10 5H7.8C6.11984 5 5.27976 5 4.63803 5.32698C4.07354 5.6146 3.6146 6.07354 3.32698 6.63803C3 7.27976 3 8.11984 3 9.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21H14.2C15.8802 21 16.7202 21 17.362 20.673C17.9265 20.3854 18.3854 19.9265 18.673 19.362C19 18.7202 19 17.8802 19 16.2V14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
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
