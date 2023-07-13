import { useState } from "react";
import AllowlistToolCommonModalWrapper, {
  AllowlistToolModalSize,
} from "../../../allowlist-tool/common/modals/AllowlistToolCommonModalWrapper";
import CreateSnapshotFormSearchCollectionModal from "./CreateSnapshotFormSearchCollectionModal";

export default function CreateSnapshotFormSearchCollection({
  setCollection,
}: {
  setCollection: (param: { address: string; name: string }) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const onCollection = (param: { address: string; name: string }) => {
    setCollection(param);
    setIsOpen(false);
  };
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        type="button"
        className="tw-flex  tw-items-center tw-justify-center  tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-w-full tw-border-2 tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
      >
        Or search
      </button>
      <AllowlistToolCommonModalWrapper
        showModal={isOpen}
        onClose={() => setIsOpen(false)}
        title="Search collection"
        modalSize={AllowlistToolModalSize.LARGE}
      >
        <CreateSnapshotFormSearchCollectionModal
          setCollection={onCollection}
        />
      </AllowlistToolCommonModalWrapper>
    </>
  );
}
