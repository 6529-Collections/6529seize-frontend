import { useId } from "react";

interface TimelineMark {
  /** Position on the timeline, in the same unit as `start` and `end`. */
  readonly at: number;
  readonly label: string;
  readonly tone?: "neutral" | "accent" | "warning";
}

interface TimelineSpan {
  readonly from: number;
  readonly to: number;
  readonly label: string;
  readonly tone?: "neutral" | "accent" | "warning";
}

type Tone = NonNullable<TimelineMark["tone"]>;

const MARK: Readonly<Record<Tone, string>> = {
  neutral: "tw-stroke-iron-400 tw-fill-iron-400",
  accent: "tw-stroke-primary-400 tw-fill-primary-400",
  warning: "tw-stroke-amber-300 tw-fill-amber-300",
};

const SPAN: Readonly<Record<Tone, string>> = {
  neutral: "tw-stroke-iron-400 tw-fill-iron-400/15",
  accent: "tw-stroke-primary-400 tw-fill-primary-400/15",
  warning: "tw-stroke-amber-300 tw-fill-amber-300/15",
};

const DOT: Readonly<Record<Tone, string>> = {
  neutral: "tw-bg-iron-400",
  accent: "tw-bg-primary-400",
  warning: "tw-bg-amber-300",
};

const WIDTH = 1_000;
const HEIGHT = 64;
const AXIS_Y = 40;

/**
 * A horizontal timeline drawn in inline SVG (`<title>` and `<desc>` name it),
 * with the marks and spans repeated as an HTML list underneath: the list is
 * what screen readers and narrow screens use. The SVG stretches to the width
 * (`preserveAspectRatio="none"`), so its strokes don't scale and the mark
 * dots are HTML, which keeps them round at any width.
 */
export default function Timeline({
  start,
  end,
  marks,
  spans = [],
  title,
  description,
  startLabel,
  endLabel,
}: {
  readonly start: number;
  readonly end: number;
  readonly marks: readonly TimelineMark[];
  readonly spans?: readonly TimelineSpan[];
  readonly title: string;
  readonly description: string;
  readonly startLabel: string;
  readonly endLabel: string;
}) {
  const range = Math.max(1, end - start);
  const x = (value: number) =>
    Math.min(WIDTH, Math.max(0, ((value - start) / range) * WIDTH));
  const titleId = useId();
  return (
    <div>
      <div className="tw-relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-labelledby={`${titleId}-title ${titleId}-desc`}
          className="tw-block tw-h-16 tw-w-full"
          preserveAspectRatio="none"
        >
          <title id={`${titleId}-title`}>{title}</title>
          <desc id={`${titleId}-desc`}>{description}</desc>
          {spans.map((span) => (
            <rect
              key={span.label}
              x={x(span.from)}
              y={AXIS_Y - 14}
              width={Math.max(2, x(span.to) - x(span.from))}
              height={28}
              rx={4}
              vectorEffect="non-scaling-stroke"
              className={`${SPAN[span.tone ?? "accent"]} tw-stroke-[1.5]`}
            />
          ))}
          <line
            x1={0}
            x2={WIDTH}
            y1={AXIS_Y}
            y2={AXIS_Y}
            vectorEffect="non-scaling-stroke"
            className="tw-stroke-iron-600 tw-stroke-2"
          />
          {marks.map((mark) => (
            <g
              key={`${mark.at}-${mark.label}`}
              className={MARK[mark.tone ?? "neutral"]}
            >
              <line
                x1={x(mark.at)}
                x2={x(mark.at)}
                y1={AXIS_Y - 18}
                y2={AXIS_Y + 18}
                vectorEffect="non-scaling-stroke"
                className="tw-stroke-2"
              />
            </g>
          ))}
        </svg>
        {marks.map((mark) => (
          <span
            key={`${mark.at}-${mark.label}`}
            aria-hidden="true"
            className={`tw-absolute tw-size-3 -tw-translate-x-1/2 -tw-translate-y-1/2 tw-rounded-full ${DOT[mark.tone ?? "neutral"]}`}
            style={{
              left: `${(x(mark.at) / WIDTH) * 100}%`,
              top: `${(AXIS_Y / HEIGHT) * 100}%`,
            }}
          />
        ))}
      </div>
      <div
        className="tw-mt-1 tw-flex tw-justify-between tw-text-[11px] tw-text-iron-500"
        aria-hidden="true"
      >
        <span>{startLabel}</span>
        <span>{endLabel}</span>
      </div>
      <ul className="tw-m-0 tw-mt-3 tw-list-none tw-space-y-1.5 tw-p-0">
        {[
          ...spans.map((span) => ({
            key: `s-${span.label}`,
            at: span.from,
            label: span.label,
            tone: span.tone ?? "accent",
          })),
          ...marks.map((mark) => ({
            key: `m-${mark.at}-${mark.label}`,
            at: mark.at,
            label: mark.label,
            tone: mark.tone ?? "neutral",
          })),
        ]
          .sort((left, right) => left.at - right.at)
          .map((item) => (
            <li
              key={item.key}
              className="tw-flex tw-items-baseline tw-gap-2 tw-text-sm tw-leading-6 tw-text-iron-300"
            >
              <span
                aria-hidden="true"
                className={`tw-inline-block tw-size-2 tw-flex-none tw-rounded-full ${DOT[item.tone]}`}
              />
              <span>{item.label}</span>
            </li>
          ))}
      </ul>
    </div>
  );
}
