import { useRef } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";

export default function FilterModalWrapper({
  onClose,
  children,
}: {
  readonly onClose: () => void;
  readonly children: React.ReactNode;
  }) {
    const modalRef = useRef<HTMLDivElement>(null);
    useClickAway(modalRef, onClose);
    useKeyPressEvent("Escape", onClose);
  return (
    <div className="tw-relative tw-z-10">
      <div className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75"></div>
      <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
        <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-text-center sm:tw-items-center tw-p-2 lg:tw-p-0">
          <div
            ref={modalRef}
            className="sm:tw-max-w-lg tw-relative tw-w-full tw-transform tw-rounded-xl tw-bg-iron-950 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 sm:tw-w-full tw-p-6 lg:tw-p-8"
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
