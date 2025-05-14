import { Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import GroupsSidebar from "./GroupsSidebar";

export default function GroupsSidebarApp({
  open,
  onClose,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
}) {
  // Swipe-down close removed as it interfered with scroll behavior

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog
        as="div"
        className="tw-fixed tw-inset-0 tw-z-[1010] tw-overflow-hidden tailwind-scope"
        onClose={onClose}
      >
        <div className="tw-fixed tw-inset-0 tw-flex tw-items-end">
          <TransitionChild
            as={Fragment}
            enter="tw-transform tw-ease-out tw-duration-[225ms]"
            enterFrom="tw-translate-y-full"
            enterTo="tw-translate-y-0"
            leave="tw-transform tw-ease-in tw-duration-[195ms]"
            leaveFrom="tw-translate-y-0"
            leaveTo="tw-translate-y-full"
          >
            <DialogPanel className="tw-pointer-events-auto tw-w-full tw-h-screen tw-bg-iron-950 tw-shadow-xl tw-flex tw-flex-col tw-rounded-t-2xl tw-pb-[env(safe-area-inset-bottom,0px)] tw-pt-[env(safe-area-inset-top,0px)]">
              <div className="tw-flex tw-items-center tw-justify-end tw-px-4 tw-mb-2">
                <button
                  type="button"
                  aria-label="Close sidebar"
                  className="tw-text-iron-300 tw-transition-colors tw-duration-200 tw-bg-iron-950 tw-border-0 tw-rounded-full tw-h-10 tw-w-10 tw-flex tw-items-center tw-justify-center"
                  onClick={onClose}
                >
                  <XMarkIcon className="tw-w-7 tw-h-7 tw-flex-shrink-0" />
                </button>
              </div>
              <nav className="tw-flex-1 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 tw-px-4">
                <GroupsSidebar />
              </nav>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
