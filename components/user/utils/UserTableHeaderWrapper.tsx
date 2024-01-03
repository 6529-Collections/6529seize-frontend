export default function UserTableHeaderWrapper({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <div className="tw-h-full tw-flex tw-items-center tw-justify-between tw-w-full">
      <h3 className="mb-0 tw-text-lg tw-font-semibold tw-text-iron-50 tw-tracking-tight">
        {children}
      </h3>
    </div>
  );
}
