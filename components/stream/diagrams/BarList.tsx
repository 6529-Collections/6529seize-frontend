import { STREAM_LABEL } from "@/components/stream/ui/styles";

interface BarListItem {
  readonly key: string;
  readonly label: string;
  /** The bar's length relative to the longest (0 to 1). */
  readonly fraction: number;
  /** The value text, already formatted. */
  readonly value: string;
  /** A short tag after the value, for example "sells" or "most". */
  readonly tag?: string;
  readonly emphasis?: boolean;
}

/**
 * A bar list for comparisons: a label, a bar and its value per row. An
 * optional marker (for example the 90% breadth threshold) is drawn on every
 * bar at the same position and named in `markerLabel`.
 */
export default function BarList({
  items,
  label,
  marker,
  markerLabel,
}: {
  readonly items: readonly BarListItem[];
  readonly label: string;
  /** Position of the marker (0 to 1), or none. */
  readonly marker?: number;
  readonly markerLabel?: string;
}) {
  return (
    <div>
      <ul
        aria-label={label}
        className="tw-m-0 tw-list-none tw-space-y-1.5 tw-p-0"
      >
        {items.map((item) => (
          <li
            key={item.key}
            className={`tw-grid tw-grid-cols-[minmax(6rem,auto)_minmax(0,1fr)_auto] tw-items-center tw-gap-3 tw-rounded-lg tw-px-2 tw-py-1 tw-text-sm tw-tabular-nums ${item.emphasis === true ? "tw-bg-primary-500/10" : ""}`}
          >
            <span
              className={
                item.emphasis === true
                  ? "tw-font-medium tw-text-iron-50"
                  : "tw-text-iron-300"
              }
            >
              {item.label}
            </span>
            <span
              aria-hidden="true"
              className="tw-relative tw-h-2 tw-rounded-sm tw-bg-iron-900"
            >
              <span
                className={`tw-absolute tw-inset-y-0 tw-left-0 tw-rounded-sm ${item.emphasis === true ? "tw-bg-primary-400" : "tw-bg-iron-500"}`}
                style={{
                  width: `${Math.max(0, Math.min(1, item.fraction)) * 100}%`,
                }}
              />
              {marker === undefined ? null : (
                <span
                  className="tw-absolute -tw-inset-y-1 tw-w-px tw-border-0 tw-border-l tw-border-dashed tw-border-iron-300"
                  style={{ left: `${marker * 100}%` }}
                />
              )}
            </span>
            <span className="tw-whitespace-nowrap tw-text-right tw-text-iron-200">
              {item.value}
              {item.tag === undefined ? null : (
                <span className="tw-ml-2 tw-text-xs tw-font-medium tw-text-primary-300">
                  {item.tag}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      {markerLabel === undefined ? null : (
        <p
          className={`${STREAM_LABEL} tw-mt-2 tw-normal-case tw-tracking-normal`}
        >
          {markerLabel}
        </p>
      )}
    </div>
  );
}
