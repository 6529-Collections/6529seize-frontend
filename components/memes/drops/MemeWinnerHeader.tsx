interface MemeWinnerHeaderProps {
  readonly title: string;
}

export default function MemeWinnerHeader({ title }: MemeWinnerHeaderProps) {
  return (
    <h3 className="tw-m-0 tw-min-w-0 tw-max-w-full tw-text-lg tw-font-semibold tw-leading-6 tw-text-iron-100 [overflow-wrap:anywhere]">
      {title}
    </h3>
  );
}
