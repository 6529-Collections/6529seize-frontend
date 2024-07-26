export default function ProfileActivityLogItemAction({
  action,
}: {
  readonly action: string;
}) {
  return (
    <span className="tw-whitespace-nowrap tw-text-base tw-text-iron-400 tw-font-medium">
      {action}
    </span>
  );
}
