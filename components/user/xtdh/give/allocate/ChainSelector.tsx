"use client";

export default function ChainSelector({
  value,
  onChange,
}: {
  readonly value: string;
  readonly onChange: (v: string) => void;
}) {
  return (
    <select
      className="tw-bg-iron-800 tw-text-iron-100 tw-rounded tw-border tw-border-iron-700 tw-px-2 tw-py-2 tw-cursor-not-allowed tw-opacity-60"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled
    >
      <option value="eth-mainnet">Ethereum</option>
    </select>
  );
}
