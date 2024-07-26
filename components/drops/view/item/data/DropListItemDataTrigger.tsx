export default function DropListItemDataTrigger({
  open,
  setOpen,
}: {
  readonly open: boolean;
  readonly setOpen: (open: boolean) => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setOpen(!open);
      }}
      type="button"
      className={`${
        open
          ? "tw-text-primary-400 hover:tw-text-primary-300"
          : "tw-text-iron-400 hover:tw-text-iron-50"
      } tw-group tw-bg-transparent tw-rounded-lg tw-border-none tw-flex tw-items-center tw-gap-x-1 -tw-ml-2 tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-transition tw-ease-out tw-duration-300`}
    >
      <span>Show more</span>
      <svg
        className={`${
          open ? "tw-rotate-90" : ""
        } tw-h-5 tw-w-5 tw-transform tw-transition tw-ease-out tw-duration-300`}
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
