type FlowTone = "neutral" | "accent" | "muted" | "warning";

interface FlowNode {
  readonly label: string;
  readonly detail?: string;
  readonly tone?: FlowTone;
}

interface FlowLane {
  /** A short heading for the lane (for example "Off-chain" or "On-chain"). */
  readonly title?: string;
  readonly nodes: readonly FlowNode[];
  /** Labels on the arrows between consecutive nodes (length nodes − 1). */
  readonly connectors?: readonly string[];
}

const TONES: Readonly<Record<FlowTone, string>> = {
  neutral: "tw-border-iron-700 tw-bg-iron-900",
  accent: "tw-border-primary-400/50 tw-bg-primary-500/10",
  muted: "tw-border-dashed tw-border-iron-700 tw-bg-transparent",
  warning: "tw-border-amber-400/40 tw-bg-amber-400/5",
};

function Node({ node }: { readonly node: FlowNode }) {
  return (
    <div
      className={`tw-min-w-0 tw-flex-1 tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-2 ${TONES[node.tone ?? "neutral"]}`}
    >
      <span className="tw-block tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-100">
        {node.label}
      </span>
      {node.detail === undefined ? null : (
        <span className="tw-mt-0.5 tw-block tw-text-xs tw-leading-5 tw-text-iron-400">
          {node.detail}
        </span>
      )}
    </div>
  );
}

function Connector({ label }: { readonly label: string | undefined }) {
  return (
    <span
      aria-hidden="true"
      className="tw-flex tw-flex-none tw-flex-col tw-items-center tw-justify-center tw-px-1 tw-text-iron-500 @[34rem]:tw-flex-row"
    >
      {label === undefined || label === "" ? null : (
        <span className="tw-text-[11px] tw-leading-4 tw-text-iron-400">
          {label}
        </span>
      )}
      <span className="tw-rotate-90 @[34rem]:tw-rotate-0">→</span>
    </span>
  );
}

/**
 * Boxes and arrows, one or more lanes. Each lane reads as a list of steps; the
 * arrows and their labels are decorative, so put anything the reader needs
 * into the node text too.
 */
export default function Flow({
  lanes,
  label,
}: {
  readonly lanes: readonly FlowLane[];
  readonly label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="tw-flex tw-flex-col tw-gap-5"
    >
      {lanes.map((lane, laneIndex) => (
        <div key={lane.title ?? laneIndex} className="tw-min-w-0">
          {lane.title === undefined ? null : (
            <p className="tw-m-0 tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
              {lane.title}
            </p>
          )}
          <ol className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-items-stretch tw-gap-1 tw-p-0 @[34rem]:tw-flex-row">
            {lane.nodes.map((node, index) => (
              <li
                key={node.label}
                className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-items-stretch tw-gap-1 @[34rem]:tw-flex-row"
              >
                <Node node={node} />
                {index < lane.nodes.length - 1 ? (
                  <Connector label={lane.connectors?.[index]} />
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
