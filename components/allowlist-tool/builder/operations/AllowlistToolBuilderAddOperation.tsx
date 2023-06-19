import { useState } from "react";
import { AllowlistOperationCode } from "../../allowlist-tool.types";
import AllowlistToolPlusIcon from "../../icons/AllowlistToolPlusIcon";
import AllowlistToolCommonModalWrapper, {
  AllowlistToolModalSize,
} from "../../common/modals/AllowlistToolCommonModalWrapper";
import AllowlistToolAddOperationModal from "./add-modal/AllowlistToolAddOperationModal";

export default function AllowlistToolBuilderAddOperation({
  title,
  targetItemId,
  defaultOperation,
  validOperations,
}: {
  title: string;
  targetItemId: string | null;
  defaultOperation: AllowlistOperationCode | null;
  validOperations: AllowlistOperationCode[];
}) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowModal(true);
        }}
        type="button"
        className="tw-group tw-flex tw-justify-center tw-items-center tw-rounded-full tw-bg-transparent tw-h-8 tw-w-8 tw-text-white tw-border-none hover:tw-bg-neutral-700 tw-transition-all tw-duration-300 tw-ease-out"
      >
        <div className="tw-h-5 tw-w-5 tw-flex tw-items-center tw-justify-center">
          <AllowlistToolPlusIcon />
        </div>
      </button>
      <AllowlistToolCommonModalWrapper
        showModal={showModal}
        onClose={() => setShowModal(false)}
        title={title}
        modalSize={AllowlistToolModalSize.LARGE}
      >
        <AllowlistToolAddOperationModal
          targetItemId={targetItemId}
          defaultOperation={defaultOperation}
          validOperations={validOperations}
          onClose={() => setShowModal(false)}
        />
      </AllowlistToolCommonModalWrapper>
    </div>
  );
}
