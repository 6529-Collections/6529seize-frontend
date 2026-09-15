export interface DockUpdateGeometry {
  readonly width: number;
  readonly height: number;
  readonly radius: number;
  readonly bubbleWidth: number;
  readonly bubbleHeight: number;
}

/** One closed contour: the dock's top edge rises around the rocket, without a join. */
export function getDockUpdatePath({
  width,
  height,
  radius,
  bubbleWidth,
  bubbleHeight,
}: DockUpdateGeometry): string {
  const r = Math.max(0, Math.min(radius - 0.5, height / 2 - 0.5));
  const right = width - 0.5;
  const bottom = height + bubbleHeight - 0.5;
  const top = bubbleHeight + 0.5;
  const center = width / 2;
  const leftShoulder = center - bubbleWidth / 2;
  const rightShoulder = center + bubbleWidth / 2;
  const controlOffset = (bubbleWidth * 24) / 104;
  return [
    `M ${r + 0.5} ${top}`,
    `H ${leftShoulder}`,
    `C ${leftShoulder + controlOffset} ${top} ${leftShoulder + controlOffset} 0.5 ${center} 0.5`,
    `C ${rightShoulder - controlOffset} 0.5 ${rightShoulder - controlOffset} ${top} ${rightShoulder} ${top}`,
    `H ${right - r}`,
    `A ${r} ${r} 0 0 1 ${right} ${top + r}`,
    `V ${bottom - r}`,
    `A ${r} ${r} 0 0 1 ${right - r} ${bottom}`,
    `H ${r + 0.5}`,
    `A ${r} ${r} 0 0 1 0.5 ${bottom - r}`,
    `V ${top + r}`,
    `A ${r} ${r} 0 0 1 ${r + 0.5} ${top} Z`,
  ].join(" ");
}
