import { useRef } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";

export default function SelectGroupModal({
  onClose,
}: {
  readonly onClose: () => void;
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
            className="sm:tw-max-w-md tw-relative tw-w-full tw-transform tw-rounded-xl tw-bg-iron-950 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 sm:tw-w-full tw-p-6"
          >
            <div className="tw-flex tw-justify-between">
              <div className="tw-max-w-xl sm:tw-flex tw-items-center sm:tw-space-x-4">
                <div>
                  <span className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-h-11 tw-w-11 tw-bg-iron-800 tw-border tw-border-solid tw-border-iron-700">
                    <svg
                      className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-text-iron-50 group-hover:tw-scale-105 tw-transition tw-duration-300 tw-ease-out"
                      clipRule="evenodd"
                      fillRule="evenodd"
                      height="512"
                      strokeLinejoin="round"
                      strokeMiterlimit="2"
                      viewBox="0 0 32 32"
                      width="512"
                      xmlns="http://www.w3.org/2000/svg"
                      id="fi_4803084"
                    >
                      <path
                        fill="currentColor"
                        d="m15.628 2c-3.864 0-7 3.137-7 7s3.136 7 7 7c3.863 0 7-3.137 7-7s-3.137-7-7-7zm0 2c2.759 0 5 2.24 5 5s-2.241 5-5 5c-2.76 0-5-2.24-5-5s2.24-5 5-5z"
                      ></path>
                      <path
                        fill="currentColor"
                        d="m3.628 28h12.372c.552 0 1 .448 1 1s-.448 1-1 1h-13.372c-.553 0-1-.448-1-1 0 0 0-.825 0-2 0-4.971 4.029-9 9-9h5.377c.552 0 1 .448 1 1s-.448 1-1 1h-5.377c-3.866 0-7 3.134-7 7z"
                      ></path>
                      <path
                        fill="currentColor"
                        d="m21.917 20.108 1.725-3.332c.172-.332.515-.54.888-.54.374 0 .717.208.888.54l1.726 3.332 3.702.612c.369.061.673.322.788.677.116.356.024.746-.239 1.012l-2.636 2.671.563 3.71c.056.369-.099.739-.401.959-.302.219-.702.252-1.036.085l-3.355-1.682-3.354 1.682c-.334.167-.734.134-1.036-.085-.302-.22-.457-.59-.401-.959l.562-3.71-2.635-2.671c-.263-.266-.355-.656-.24-1.012.116-.355.42-.616.789-.677zm2.613-.698-1.068 2.063c-.145.28-.414.475-.725.527l-2.291.378 1.631 1.654c.222.224.324.54.277.852l-.348 2.296 2.076-1.04c.282-.142.615-.142.897 0l2.076 1.04-.348-2.296c-.047-.312.055-.628.277-.852l1.631-1.654-2.291-.378c-.312-.052-.58-.247-.725-.527z"
                      ></path>
                    </svg>
                  </span>
                </div>
                <p className="tw-mt-3 sm:tw-mt-0 tw-whitespace-wrap md:tw-max-w-sm tw-text-lg tw-text-iron-50 tw-font-medium tw-mb-0">
                  Find a group
                </p>
              </div>
              <div className="tw-absolute tw-right-4 tw-top-4 sm:tw-top-6 tw-flex tw-justify-between tw-items-center">
                <button
                  onClick={onClose}
                  type="button"
                  className="tw-p-2.5 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-950 tw-border-0 tw-text-iron-400 hover:tw-text-iron-50 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out"
                >
                  <span className="tw-sr-only tw-text-sm">Close</span>
                  <svg
                    className="tw-h-6 tw-w-6"
                    aria-hidden="true"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="tw-col-span-full">
              <div className="tw-grid md:tw-grid-cols-2 tw-gap-4">
                <div className="tw-relative">
                  <svg
                    className="tw-pointer-events-none tw-absolute tw-left-3 tw-top-3.5 tw-h-5 tw-w-5 tw-text-iron-300"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by user"
                    className="tw-pl-11 tw-form-input tw-appearance-none tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-pr-3 tw-bg-[#1C1D20] tw-text-iron-50 tw-font-medium tw-caret-primary-400 tw-shadow-sm tw-ring-2 tw-ring-inset tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset hover:tw-ring-neutral-600 focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
                  />
                </div>
                <div className="tw-relative">
                  <svg
                    className="tw-pointer-events-none tw-absolute tw-left-3 tw-top-3.5 tw-h-5 tw-w-5 tw-text-iron-300"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by curation name"
                    className="tw-pl-11 tw-form-input tw-appearance-none tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-pr-3 tw-bg-[#1C1D20] tw-text-iron-50 tw-font-medium tw-caret-primary-400 tw-shadow-sm tw-ring-2 tw-ring-inset tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset hover:tw-ring-neutral-600 focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
