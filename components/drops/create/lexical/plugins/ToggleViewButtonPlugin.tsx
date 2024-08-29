export default function ToggleViewButtonPlugin({
  onViewClick,
}: {
  readonly onViewClick: () => void;
}) {
  return (
    <button
      onClick={onViewClick}
      type="button"
      aria-label="Expand view"
      className="tw-cursor-pointer tw-flex tw-items-center tw-justify-center tw-p-2 tw-group tw-absolute tw-top-1.5 tw-right-2 tw-rounded-lg tw-border-none tw-bg-transparent tw-text-iron-400 hover:tw-text-iron-50 tw-ease-out tw-transition tw-duration-300"
    >
      <svg
        className="tw-h-5 tw-w-5"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M21 14V16.2C21 17.8802 21 18.7202 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C18.7202 21 17.8802 21 16.2 21H14M10 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V10M15 9L21 3M21 3H15M21 3V9M9 15L3 21M3 21H9M3 21L3 15"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
