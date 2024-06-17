export default function GroupCreateWrapper({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <div className="tw-mt-4 lg:tw-mt-6 tailwind-scope tw-relative">
      <div>{children}</div>
    </div>
  );
}
