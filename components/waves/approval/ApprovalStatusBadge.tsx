import { CheckCircleIcon } from "@heroicons/react/24/solid";

interface ApprovalStatusBadgeProps {
  readonly approvedAt?: number | null | undefined;
  readonly order?: number | null | undefined;
  readonly size?: "sm" | "md" | undefined;
}

export default function ApprovalStatusBadge({
  approvedAt = null,
  order = null,
  size = "sm",
}: ApprovalStatusBadgeProps) {
  const hasOrder = typeof order === "number" && Number.isFinite(order);
  const label = hasOrder ? `Approved #${order}` : "Approved";
  const title =
    typeof approvedAt === "number" && Number.isFinite(approvedAt)
      ? `${label} on ${new Date(approvedAt).toISOString()}`
      : label;
  const sizeClasses =
    size === "md"
      ? "tw-gap-1.5 tw-px-2.5 tw-py-1 tw-text-xs"
      : "tw-gap-1 tw-px-2 tw-py-0.5 tw-text-[11px]";

  return (
    <span
      title={title}
      className={`tw-inline-flex tw-flex-shrink-0 tw-items-center tw-rounded-full tw-border tw-border-solid tw-border-emerald-400/25 tw-bg-emerald-400/10 tw-font-semibold tw-leading-none tw-text-emerald-300 ${sizeClasses}`}
    >
      <CheckCircleIcon className="tw-size-3.5 tw-flex-shrink-0" />
      <span>{label}</span>
    </span>
  );
}
