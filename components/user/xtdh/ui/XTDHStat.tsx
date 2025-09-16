"use client";

export default function XTDHStat({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-1">
      <div className="tw-text-iron-400 tw-text-xs tw-uppercase">{label}</div>
      <div className="tw-text-iron-100 tw-text-lg tw-font-semibold">{value}</div>
    </div>
  );
}

