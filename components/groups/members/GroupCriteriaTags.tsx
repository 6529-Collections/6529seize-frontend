export default function GroupCriteriaTags({
  items,
}: {
  readonly items: readonly string[];
}) {
  // Preserve Safari list semantics when the visual list markers are removed.
  return (
    <ul
      role="list"
      aria-live="polite"
      className="tw-m-0 tw-flex tw-max-h-40 tw-min-w-0 tw-list-none tw-flex-wrap tw-gap-2 tw-overflow-y-auto tw-overscroll-contain tw-p-0"
    >
      {items.map((item, index) => (
        <li
          key={`${index}-${item}`}
          className="tw-max-w-full tw-break-words tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.03] tw-px-2.5 tw-py-1 tw-text-xxs tw-font-normal tw-leading-5 tw-text-iron-300 [overflow-wrap:anywhere]"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
