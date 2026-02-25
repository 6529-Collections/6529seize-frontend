import { XMarkIcon } from "@heroicons/react/24/outline";

export default function UserPageRepModifyModalHeader({
  handleOrWallet,
  onClose,
}: {
  readonly handleOrWallet: string;
  readonly onClose: () => void;
}) {
  return (
    <div className="tw-flex tw-items-start tw-justify-between">
      <div className="tw-flex tw-items-center tw-gap-3">
        <span className="tw-inline-flex tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-xl tw-h-10 tw-w-10 tw-bg-white/[0.05] tw-border tw-border-solid tw-border-white/10">
          <svg
            className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-iron-50"
            clipRule="evenodd"
            fillRule="evenodd"
            strokeLinejoin="round"
            strokeMiterlimit="2"
            viewBox="0 0 32 32"
            xmlns="http://www.w3.org/2000/svg"
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
        <p className="tw-pr-8 tw-text-wrap tw-truncate md:tw-max-w-sm tw-text-lg tw-text-iron-50 tw-font-semibold tw-mb-0">
          Add Rep to {handleOrWallet}
        </p>
      </div>
      <button
        onClick={onClose}
        type="button"
        className="-tw-mt-1 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-950 tw-p-2.5 tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-50 focus:tw-outline-none"
      >
        <span className="tw-sr-only tw-text-sm">Close</span>
        <XMarkIcon className="tw-h-6 tw-w-6" />
      </button>
    </div>
  );
}
