export default function ProfileActivityLogItemAction({
  action,
}: {
  readonly action: string;
}) {
  return (
    <span className="tw-whitespace-nowrap tw-text-sm tw-font-normal tw-text-iron-500 empty:tw-hidden sm:tw-text-base">
      {action}
    </span>
  );
}
