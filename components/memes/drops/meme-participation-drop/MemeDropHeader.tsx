interface MemeDropHeaderProps {
  readonly title: string;
}

export default function MemeDropHeader({ title }: MemeDropHeaderProps) {
  return (
    <h3 className="tw-m-0 tw-inline-flex tw-items-center tw-text-lg tw-font-semibold tw-leading-6 tw-text-iron-100">
      {title}
    </h3>
  );
}
