interface MemeWinnerHeaderProps {
  readonly title: string;
}

export default function MemeWinnerHeader({ title }: MemeWinnerHeaderProps) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-y-3 sm:tw-gap-y-2 tw-items-start">
      <h3 className="tw-text-lg tw-font-semibold tw-text-iron-100 tw-mb-0">
        {title}
      </h3>
    </div>
  );
}
