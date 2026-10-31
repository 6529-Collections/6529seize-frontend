/**
 * The mark of each program on the TDH pages: a small neutral shape, so a
 * program is never told apart by a colour the status palette also uses
 * (green holds, blue decided, amber provisional). Rust is a square, program
 * B a triangle, the Python reference a diamond, the Lean model a circle and
 * 6529.io's backend a ring. Each path fills a 10 by 10 box.
 */
type TdhProgram = "rust" | "programB" | "python" | "lean" | "live";

const PROGRAM_GLYPH: Readonly<Record<TdhProgram, string>> = {
  rust: "M1 1H9V9H1Z",
  programB: "M5 0.6L9.6 9.2H0.4Z",
  python: "M5 0L10 5L5 10L0 5Z",
  lean: "M5 0A5 5 0 1 1 5 10A5 5 0 1 1 5 0Z",
  live: "M5 0A5 5 0 1 1 5 10A5 5 0 1 1 5 0ZM5 2.6A2.4 2.4 0 1 0 5 7.4A2.4 2.4 0 1 0 5 2.6Z",
};

/** Whether a series key names a program, not a collection. */
export function isTdhProgram(series: string): series is TdhProgram {
  return Object.hasOwn(PROGRAM_GLYPH, series);
}

/** A program's mark inside an SVG diagram, centred on (cx, cy). */
export function ProgramGlyph({
  program,
  cx,
  cy,
  size = 9,
}: {
  readonly program: TdhProgram;
  readonly cx: number;
  readonly cy: number;
  readonly size?: number;
}) {
  const scale = size / 10;
  return (
    <path
      d={PROGRAM_GLYPH[program]}
      fillRule="evenodd"
      transform={`translate(${cx - size / 2} ${cy - size / 2}) scale(${scale})`}
      className="tw-fill-iron-200"
    />
  );
}
