interface MemeDropDescriptionProps {
  readonly description: string;
}

export default function MemeDropDescription({
  description,
}: MemeDropDescriptionProps) {
  return (
    <div>
      <p className="tw-text-iron-400 tw-mb-0 tw-text-md">{description}</p>
    </div>
  );
}
