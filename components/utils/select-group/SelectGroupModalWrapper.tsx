import CommonAnimationWrapper from "../animation/CommonAnimationWrapper";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import CommonAnimationOpacity from "../animation/CommonAnimationOpacity";
import SelectGroupModal from "./SelectGroupModal";

export default function SelectGroupModalWrapper({
  isOpen,
  onClose,
  onGroupSelect,
}: {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onGroupSelect: (group: ApiGroupFull) => void;
}) {
  return (
    <CommonAnimationWrapper mode="sync" initial={true}>
      {isOpen && (
        <CommonAnimationOpacity
          elementClasses="tw-absolute tw-z-50"
          elementRole="dialog"
          onClicked={(e) => e.stopPropagation()}
        >
          <SelectGroupModal onClose={onClose} onGroupSelect={onGroupSelect} />
        </CommonAnimationOpacity>
      )}
    </CommonAnimationWrapper>
  );
}
