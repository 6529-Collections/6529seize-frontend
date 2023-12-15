
export default function UserPageIdentityActivityLogItemAction({
  action,
}: {
  readonly action: string;
}) {
  return (
    <span className="tw-whitespace-nowrap tw-text-sm tw-text-iron-400 tw-font-semibold">
      {action}
    </span>
  );
}
