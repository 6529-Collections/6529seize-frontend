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
      className=" tw-group tw-bg-transparent tw-rounded-lg tw-border-none tw-flex tw-items-center tw-gap-x-1 -tw-ml-2 tw-px-2 tw-py-1 tw-transition tw-ease-out tw-duration-300"
    >
      <svg
        className={`${
          open
            ? "tw-text-primary-400 group-hover:tw-text-primary-300"
            : "tw-text-iron-400 group-hover:tw-text-iron-50"
        } tw-w-5 tw-h-5 tw-transition tw-ease-out tw-duration-300`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
