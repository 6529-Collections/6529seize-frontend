import { CreateDropType } from "../../types";
import MobileWrapperDialog from "../../../../mobile-wrapper-dialog/MobileWrapperDialog";

export default function CreateDropFullMobileWrapper({
  isOpen,
  type,
  onClose,
  onViewClick,
  children,
}: {
  readonly isOpen: boolean;
  readonly type: CreateDropType;
  readonly onClose: () => void;
  readonly onViewClick: () => void;
  readonly children: React.ReactNode;
}) {
  const getTitle = () => {
    switch (type) {
      case CreateDropType.DROP:
        return "Create a Post";
      case CreateDropType.QUOTE:
        return "Create a Quote";
      default:
        return "";
    }
  };

  return (
    <MobileWrapperDialog
      title={getTitle()}
      isOpen={isOpen}
      onClose={onClose}
      onAfterLeave={onViewClick}>
      {children}
    </MobileWrapperDialog>
  );
}
