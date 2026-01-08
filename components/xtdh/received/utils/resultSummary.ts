import type { SortDirection } from "@/entities/ISort";
import { RECEIVED_RESULT_SUMMARY_MESSAGES } from "@/i18n/messages";

const DIRECTION_LABELS = RECEIVED_RESULT_SUMMARY_MESSAGES.directionLabels;
const SORTED_BY_LABEL = RECEIVED_RESULT_SUMMARY_MESSAGES.sortedByLabel;

interface BuildResultSummaryOptions<TSortField extends PropertyKey> {
  readonly count: number;
  readonly labels: Record<TSortField, string>;
  readonly sortField: TSortField;
  readonly direction: SortDirection;
  readonly singularLabel: string;
  readonly pluralLabel: string;
}

export function buildResultSummary<TSortField extends PropertyKey>(
  options: Readonly<BuildResultSummaryOptions<TSortField>>
): string {
  const { count, labels, sortField, direction, singularLabel, pluralLabel } =
    options;
  const label = labels[sortField];
  const directionLabel = DIRECTION_LABELS[direction];
  const noun = count === 1 ? singularLabel : pluralLabel;

  return `${count.toLocaleString()} ${noun} · ${SORTED_BY_LABEL} ${label} (${directionLabel})`;
}
