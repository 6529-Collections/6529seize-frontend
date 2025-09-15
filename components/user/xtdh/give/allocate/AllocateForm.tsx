"use client";

export default function AllocateForm({
  amountPerDay,
  onAmountChange,
  onReset,
  onSubmit,
  disabled,
  capacityPerDay,
  allocatedPerDay,
  helpers,
}: {
  readonly amountPerDay: string;
  readonly onAmountChange: (v: string) => void;
  readonly onReset: () => void;
  readonly onSubmit: (e: React.FormEvent) => void;
  readonly disabled: boolean;
  readonly capacityPerDay: number;
  readonly allocatedPerDay: number;
  readonly helpers?: string[];
}) {
  const remaining = Math.max(0, capacityPerDay - allocatedPerDay);
  const parsed = toNum(amountPerDay);
  const clamped = Math.max(0, Math.min(remaining, parsed));
  const over = parsed > remaining;

  const setQuick = (fraction: number) => {
    const v = Math.floor(remaining * fraction);
    onAmountChange(String(v));
  };

  const fmt = (n: number) => new Intl.NumberFormat().format(Math.floor(n));

  const onBlurAmount = () => {
    if (!amountPerDay || amountPerDay.trim() === "") return;
    const v = Math.floor(toNum(amountPerDay));
    const bounded = Math.max(0, Math.min(v, Math.floor(remaining)));
    onAmountChange(String(bounded));
  };

  const onChangeAmount = (raw: string) => {
    const s = raw.trim();
    if (s === "") {
      onAmountChange("");
      return;
    }
    const n = Math.floor(toNum(s));
    const bounded = Math.max(0, Math.min(n, Math.floor(remaining)));
    onAmountChange(String(bounded));
  };

  return (
    <form className="tw-flex tw-flex-col tw-gap-3" onSubmit={onSubmit}>
      <label className="tw-text-iron-200 tw-text-sm">Allocation (TDH Rate / day)</label>
      <input
        value={amountPerDay}
        onChange={(e) => onChangeAmount(e.target.value)}
        onBlur={onBlurAmount}
        placeholder="e.g. 0.25"
        className={`tw-bg-iron-800 tw-text-iron-100 tw-rounded tw-border tw-px-3 tw-py-2 focus:tw-outline-none ${
          over ? "tw-border-red-600" : "tw-border-iron-700 focus:tw-border-primary-500"
        }`}
      />
      <input
        type="range"
        min={0}
        max={Math.max(0, Math.floor(remaining))}
        step={1}
        value={Math.floor(clamped)}
        onChange={(e) => onAmountChange(e.target.value)}
        className="tw-w-full"
      />
      <div className="tw-flex tw-gap-2 tw-flex-wrap">
        {[0.1, 0.25, 0.5, 1].map((f) => (
          <button
            type="button"
            key={f}
            onClick={() => setQuick(f)}
            className="tw-text-xs tw-rounded tw-border tw-border-iron-700 tw-text-iron-200 tw-px-2 tw-py-1 hover:tw-bg-iron-800"
          >
            {f === 1 ? "Max" : `${Math.round(f * 100)}%`}
          </button>
        ))}
      </div>
      <div className="tw-text-xs tw-text-iron-300">
        {over ? (
          <span className="tw-text-red-400">Exceeds remaining capacity ({fmt(remaining)}/day).</span>
        ) : (
          <span>
            You will grant {fmt(clamped)}/day. Remaining capacity after this: {fmt(remaining - clamped)}/day.
          </span>
        )}
      </div>
      <div className="tw-flex tw-gap-2 tw-justify-end tw-pt-2">
        <button
          type="button"
          className="tw-bg-iron-800 tw-text-iron-200 tw-rounded tw-px-3 tw-py-2 tw-border tw-border-iron-700 hover:tw-bg-iron-700 tw-transition"
          onClick={onReset}
        >
          Reset
        </button>
        <button
          type="submit"
          className="tw-bg-primary-600 tw-text-white tw-rounded tw-px-4 tw-py-2 hover:tw-bg-primary-500 tw-transition"
          disabled={disabled || over || clamped <= 0}
          title={disabled ? "Pick a target first" : over ? "Exceeds capacity" : undefined}
        >
          Allocate {clamped > 0 ? `${fmt(clamped)}/day` : ""}
        </button>
      </div>
      <div className="tw-text-iron-400 tw-text-xs">
        {helpers?.length ? (
          <ul className="tw-list-disc tw-pl-5 tw-space-y-1">
            {helpers.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        ) : (
          <span>Distribution rules (721/1155/traits/fungible) and effective timing will be added here.</span>
        )}
      </div>
    </form>
  );
}

function toNum(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
