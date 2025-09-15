"use client";

export default function XTDHHeaderKV({
  label,
  value,
  hint,
  after,
}: {
  readonly label: string;
  readonly value: string;
  readonly hint?: string;
  readonly after?: React.ReactNode;
}) {
  return (
    <div className="tw-flex tw-items-center tw-gap-2">
      <span className="tw-text-base tw-font-medium tw-text-iron-300">{label}:</span>
      <span className="tw-text-base tw-font-semibold tw-text-iron-50">{value}</span>
      {hint ? <span className="tw-text-xs tw-text-iron-500">{hint}</span> : null}
      {after ?? null}
    </div>
  );
}

