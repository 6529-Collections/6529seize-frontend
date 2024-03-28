export default function DropListItemDataTrigger({
  open,
  setOpen,
}: {
  readonly open: boolean;
  readonly setOpen: (open: boolean) => void;
}) {
  return (
    <button
      onClick={() => setOpen(!open)}
      type="button"
      className={`${
        open ? "tw-text-primary-400" : ""
      } tw-group tw-text-iron-400 hover:tw-text-primary-400 tw-bg-transparent tw-rounded-lg tw-border-none tw-flex tw-items-center tw-gap-x-1 -tw-ml-2 tw-px-2 tw-py-1 tw-transition tw-ease-out tw-duration-300`}
    >
      <p className="tw-text-xxs tw-font-medium tw-mb-0">
        Show {open ? "less" : "more"}
      </p>
      <svg
        className={`${
          open ? "tw-rotate-90" : ""
        } -tw-mr-1 tw-transform tw-w-5 tw-h-5 tw-transition tw-ease-out tw-duration-300`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9 18L15 12L9 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
