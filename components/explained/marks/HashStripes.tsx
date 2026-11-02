/**
 * Hash stripes (EXPLAINED.md §4.2): sixteen bars from the first sixteen hex
 * digits of a hash, at equal lightness, so two hashes can be compared at a
 * glance. A fingerprint, never a status.
 */
export function stripeHues(hex: string): number[] {
  return [...hex.replace(/^0x/, "").slice(0, 16)].map((digit) => {
    const value = Number.parseInt(digit, 16);
    return Number.isNaN(value) ? 0 : Math.round(value * 22.5);
  });
}

export function stripeColor(hue: number): string {
  return `oklch(66% 0.07 ${hue})`;
}

export default function HashStripes({
  hex,
  size = "md",
}: {
  readonly hex: string;
  readonly size?: "md" | "lg";
}) {
  const bar = size === "lg" ? "tw-h-[18px] tw-w-1.5" : "tw-h-3 tw-w-1";
  return (
    <span
      className="tw-inline-flex tw-flex-none tw-gap-px tw-overflow-hidden tw-rounded-sm tw-align-middle"
      aria-hidden="true"
      data-stripes={hex.replace(/^0x/, "").slice(0, 16)}
    >
      {stripeHues(hex).map((hue, index) => (
        <i
          // The hues are positional: the index is the bar's place in the hash.
          key={`${index}-${hue}`}
          className={`tw-block ${bar}`}
          style={{ background: stripeColor(hue) }}
        />
      ))}
    </span>
  );
}
