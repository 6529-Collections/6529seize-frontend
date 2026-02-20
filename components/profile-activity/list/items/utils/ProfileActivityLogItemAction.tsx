export default function ProfileActivityLogItemAction({
  action,
}: {
  readonly action: string;
}) {
  return (
    <span className="tw-whitespace-nowrap tw-text-sm md:tw-text-md tw-text-iron-500 tw-font-medium empty:tw-hidden">
      {action}
    </span>
  );
}
