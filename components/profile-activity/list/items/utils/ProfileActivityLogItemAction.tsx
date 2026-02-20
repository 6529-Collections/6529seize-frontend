export default function ProfileActivityLogItemAction({
  action,
}: {
  readonly action: string;
}) {
  return (
    <span className="tw-whitespace-nowrap tw-text-sm lg:tw-text-base tw-text-iron-500 tw-font-normal empty:tw-hidden">
      {action}
    </span>
  );
}
