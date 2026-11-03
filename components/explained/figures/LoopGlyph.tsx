import type React from "react";

/**
 * A station's pictogram, drawn in its ring: a card, a wallet, a clock,
 * rising bars, a ballot and a mint press. Strokes only, in the station's
 * tone, so the ring reads as that station before its name does.
 */
export default function StationGlyph({
  kind,
  x,
  y,
  tone,
}: {
  readonly kind: string;
  readonly x: number;
  readonly y: number;
  readonly tone: string;
}) {
  const stroke = {
    fill: "none",
    stroke: tone,
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  let body: React.ReactNode;
  switch (kind) {
    case "art":
      body = (
        <>
          <rect x={-6.5} y={-9} width={13} height={18} rx={2} {...stroke} />
          <path d="M-4 4.5L-1 0.5L1.5 3L3 1.5L4.5 4.5" {...stroke} />
          <circle cx={2} cy={-4} r={1.6} {...stroke} />
        </>
      );
      break;
    case "hold":
      body = (
        <>
          <rect x={-9} y={-6.5} width={18} height={13} rx={2.5} {...stroke} />
          <path d="M3 -1.5H9V2.5H3a2 2 0 0 1 0-4z" {...stroke} />
        </>
      );
      break;
    case "time":
      body = (
        <>
          <circle cx={0} cy={0} r={8.5} {...stroke} />
          <path d="M0 -5V0L3.5 2.5" {...stroke} />
        </>
      );
      break;
    case "standing":
      body = (
        <path
          d="M-7 7V2M-2.5 7V-1.5M2 7V-5M6.5 7V-8.5"
          {...stroke}
          strokeWidth={2.2}
        />
      );
      break;
    case "decide":
      body = (
        <>
          <rect x={-8} y={-8} width={16} height={16} rx={2.5} {...stroke} />
          <path d="M-4 0.5L-1 3.5L4.5 -3" {...stroke} />
        </>
      );
      break;
    default:
      body = (
        <>
          <path d="M0 -9V2M-4 -2L0 2L4 -2" {...stroke} />
          <path d="M-8 6H8" {...stroke} />
        </>
      );
  }
  return (
    <g transform={`translate(${x} ${y})`} aria-hidden="true">
      {body}
    </g>
  );
}
