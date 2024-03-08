export default function SlideOver({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return <div className="tw-flex tw-justify-between">{children}</div>;
}
