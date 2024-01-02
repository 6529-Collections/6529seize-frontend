export default function UserTableHeaderWrapper({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <div className="tw-h-16 tw-px-4 sm:tw-px-6 md:tw-px-8">
      <div className="tw-h-full tw-flex tw-items-center tw-justify-between tw-w-full tw-border-b tw-border-t-0 tw-border-x-0 tw-border-solid tw-border-white/10">
        <h3 className="mb-0 tw-text-lg tw-font-semibold tw-text-iron-50 tw-tracking-tight">
          {children}
        </h3>
      </div>
    </div>
  );
}
