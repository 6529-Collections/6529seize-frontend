interface MemeWinnerDescriptionProps {
  readonly description: string;
}

export default function MemeWinnerDescription({
  description,
}: MemeWinnerDescriptionProps) {
  return (
    <p className="tw-m-0 tw-whitespace-pre-line tw-text-md tw-leading-6 tw-text-iron-400 [overflow-wrap:anywhere]">
      {description}
    </p>
  );
}
