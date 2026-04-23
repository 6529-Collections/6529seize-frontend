export default function CreateWaveInlineGroupHeader({
  eyebrow,
  title,
  description,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly description?: string | null;
}) {
  return (
    <div className="tw-min-w-0 md:tw-pr-[31rem]">
      <p className="tw-mb-1 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500">
        {eyebrow}
      </p>
      <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-100">
        {title}
      </p>
      {description && (
        <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-font-medium tw-text-iron-400">
          {description}
        </p>
      )}
    </div>
  );
}
