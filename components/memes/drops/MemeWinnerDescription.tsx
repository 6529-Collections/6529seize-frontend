interface MemeWinnerDescriptionProps {
  readonly description: string;
}

export default function MemeWinnerDescription({
  description,
}: MemeWinnerDescriptionProps) {
  return (
    <div>
      <p className="tw-mb-0 tw-whitespace-pre-line tw-text-md tw-text-iron-400">
        {description}
      </p>
    </div>
  );
}
