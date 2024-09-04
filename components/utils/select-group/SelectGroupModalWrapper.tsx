import CommonAnimationWrapper from "../animation/CommonAnimationWrapper";
import { GroupFull } from "../../../generated/models/GroupFull";
import CommonAnimationOpacity from "../animation/CommonAnimationOpacity";
import SelectGroupModal from "./SelectGroupModal";

export default function SelectGroupModalWrapper({
  isOpen,
  onClose,
  onGroupSelect,
}: {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onGroupSelect: (group: GroupFull) => void;
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
