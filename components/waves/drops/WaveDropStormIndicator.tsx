export default function WaveDropStormIndicator({
  currentPartIndex,
  partsCount,
  className = "",
}: {
  readonly currentPartIndex: number;
  readonly partsCount: number;
  readonly className?: string;
}) {
  return (
    <div className={`tw-relative tw-mt-2 tw-inline-flex ${className}`}>
      <span className="tw-mb-1.5 tw-text-xs tw-text-iron-50">
        {currentPartIndex + 1} /{" "}
        <span className="tw-text-iron-400">{partsCount}</span>
      </span>
    </div>
  );
}
