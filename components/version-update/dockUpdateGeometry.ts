export interface DockUpdateGeometry {
  readonly width: number;
  readonly height: number;
  readonly radius: number;
  readonly bubbleWidth: number;
  readonly bubbleHeight: number;
}

/** One closed contour: the dock's top edge rises around the rocket, without a join. */
export function getDockUpdatePath(
  { width, height, radius, bubbleWidth, bubbleHeight }: DockUpdateGeometry,
  inset = 0
): string {
  const r = Math.max(0, Math.min(radius - inset, height / 2 - inset));
  const right = width - inset;
  const bottom = height + bubbleHeight - inset;
  const top = bubbleHeight + inset;
  const center = width / 2;
  const leftShoulder = center - bubbleWidth / 2;
  const rightShoulder = center + bubbleWidth / 2;
  const controlOffset = (bubbleWidth * 24) / 104;
  return [
    `M ${r + inset} ${top}`,
    `H ${leftShoulder}`,
    `C ${leftShoulder + controlOffset} ${top} ${leftShoulder + controlOffset} inset ${center} inset`,
    `C ${rightShoulder - controlOffset} inset ${rightShoulder - controlOffset} ${top} ${rightShoulder} ${top}`,
    `H ${right - r}`,
    `A ${r} ${r} 0 0 1 ${right} ${top + r}`,
    `V ${bottom - r}`,
    `A ${r} ${r} 0 0 1 ${right - r} ${bottom}`,
    `H ${r + inset}`,
    `A ${r} ${r} 0 0 1 inset ${bottom - r}`,
    `V ${top + r}`,
    `A ${r} ${r} 0 0 1 ${r + inset} ${top} Z`,
  ].join(" ");
}

export function getDockBubblePath({
  width,
  bubbleWidth,
  bubbleHeight,
}: DockUpdateGeometry): string {
  const left = (width - bubbleWidth) / 2;
  const right = (width + bubbleWidth) / 2;
  const offset = (bubbleWidth * 24) / 104;
  const top = bubbleHeight + 0.5;
  return `M ${left} ${top} C ${left + offset} ${top} ${left + offset} 0.5 ${width / 2} 0.5 C ${right - offset} 0.5 ${right - offset} ${top} ${right} ${top}`;
}
