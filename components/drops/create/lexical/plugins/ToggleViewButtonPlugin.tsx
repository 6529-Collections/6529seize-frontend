export default function ToggleViewButtonPlugin({
  onViewClick,
}: {
  readonly onViewClick: () => void;
}) {
  return (
    <button
      onClick={onViewClick}
      className="tw-absolute tw-top-[0.625rem] tw-right-2 tw-border-none tw-bg-transparent"
    >
      <svg
        className="tw-h-5 tw-w-5 tw-text-iron-300"
        viewBox="0 0 512 512"
        fill="currentColor"
        aria-hidden="true"
      >
        <g id="ARROW_48" data-name="ARROW 48">
          <path d="m487.84 272.85a24 24 0 0 0 -24 24v96.61a70.46 70.46 0 0 1 -70.38 70.38h-274.92a70.46 70.46 0 0 1 -70.38-70.38v-274.92a70.46 70.46 0 0 1 70.38-70.38h96.61a24 24 0 1 0 0-48h-96.61a118.52 118.52 0 0 0 -118.38 118.38v274.92a118.52 118.52 0 0 0 118.38 118.38h274.92a118.52 118.52 0 0 0 118.38-118.38v-96.61a24 24 0 0 0 -24-24z"></path>
          <path d="m487.33 0h-149.2a24 24 0 0 0 -24 23.53c-.25 13.47 11.08 24.47 24.54 24.47h91.33l-191.14 191.2a24 24 0 0 0 0 33.94 24 24 0 0 0 33.94 0l191.2-191.14v91.66a24 24 0 0 0 48 0v-149a24.66 24.66 0 0 0 -24.67-24.66z"></path>
        </g>
      </svg>
    </button>
  );
}
