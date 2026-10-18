/**
 * The live pulse (EXPLAINED.md §5.4): a blue dot with a static ring. It does
 * not animate, under any motion setting; when a source is late the ring goes
 * and the dot turns grey, and the words beside it say "late".
 */
export default function Pulse({ live = true }: { readonly live?: boolean }) {
  return (
    <span
      className={`tw-relative tw-inline-block tw-size-2 tw-flex-none tw-rounded-full ${live ? "tw-bg-primary-400" : "tw-bg-iron-400"}`}
      aria-hidden="true"
      data-pulse={live ? "live" : "late"}
    >
      {live && (
        <span className="tw-absolute -tw-inset-1 tw-rounded-full tw-border tw-border-solid tw-border-primary-400/45" />
      )}
    </span>
  );
}
