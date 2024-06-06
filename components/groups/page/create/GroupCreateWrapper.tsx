export default function GroupCreateWrapper({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <div className="tailwind-scope tw-relative tw-z-10">
      <div className="tw-max-w-2xl tw-mx-auto">{children}</div>
    </div>
  );
}
