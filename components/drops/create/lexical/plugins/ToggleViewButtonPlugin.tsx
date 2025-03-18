export default function ToggleViewButtonPlugin({
  onViewClick,
}: {
  readonly onViewClick: () => void;
}) {
  return (
    <button
      onClick={onViewClick}
      type="button"
      className="tw-relative tw-ml-auto tw-h-8 tw-w-8 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-transparent hover:tw-bg-iron-900 tw-border-0 tw-text-iron-300 hover:tw-text-iron-400 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out">
      <span className="tw-sr-only tw-text-sm">Cancel</span>
      <svg
        className="tw-h-6 tw-w-6"
        aria-hidden="true"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor">
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
