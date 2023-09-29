export default function CommonInputLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
      {children}
    </label>
  );
}
