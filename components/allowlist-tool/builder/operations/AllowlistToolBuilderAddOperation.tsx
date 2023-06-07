import { useState } from "react";
import { AllowlistOperationCode } from "../../allowlist-tool.types";
import AllowlistToolPlusIcon from "../../icons/AllowlistToolPlusIcon";
import AllowlistToolModelWrapper, {
  AllowlistToolModalSize,
} from "../../common/AllowlistToolModelWrapper";
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
        className="tw-group tw-rounded-full tw-bg-transparent tw-p-2 tw-text-white tw-border-none hover:tw-bg-neutral-700 tw-transition-all tw-duration-300 tw-ease-out"
      >
        <div className="tw-h-5 tw-w-5 tw-flex tw-items-center tw-justify-center">
          <AllowlistToolPlusIcon />
        </div>
      </button>
      <AllowlistToolModelWrapper
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
      </AllowlistToolModelWrapper>
    </div>
  );
}
