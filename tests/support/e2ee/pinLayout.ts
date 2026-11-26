import { expect, type Locator } from "@playwright/test";

export async function expectPinBeforeTimestamp(row: Locator) {
  const [rowBox, pinBox, timeBox] = await Promise.all([
    row.boundingBox(),
    row.getByRole("button").boundingBox(),
    row.getByRole("time").boundingBox(),
  ]);
  if (!rowBox || !pinBox || !timeBox) {
    throw new Error("The chat row, pin, and timestamp must all be visible");
  }

  const centerY = (box: { y: number; height: number }) =>
    box.y + box.height / 2;
  expect(pinBox.x + pinBox.width).toBeLessThan(timeBox.x);
  expect(centerY(pinBox)).toBeCloseTo(centerY(rowBox), 0);
  expect(centerY(timeBox)).toBeCloseTo(centerY(rowBox), 0);
  return timeBox;
}
