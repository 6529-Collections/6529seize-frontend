import CommonModalWrapper, {
  CommonModalWrapperSize,
} from "../../utils/modal/CommonModalWrapper";

export default function UserPageIdentityRateModal({
  isModalOpen,
  setIsModalOpen,
}: {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
}) {
  return (
    <CommonModalWrapper
      showModal={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      modalSize={CommonModalWrapperSize.X_LARGE}
    >
      <div className="tw-p-6">
        <p className="tw-max-w-sm tw-text-lg tw-text-white tw-font-medium tw-mb-0">
          rate things
        </p>
      </div>
    </CommonModalWrapper>
  );
}
