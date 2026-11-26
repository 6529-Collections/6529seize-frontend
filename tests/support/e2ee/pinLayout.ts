import { expect, type Locator, type Page } from "@playwright/test";

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

export function encryptedInbox(page: Page): Locator {
  return page.getByRole("list", { name: "Encrypted chats" }).last();
}

export async function pinEncryptedChat(inbox: Locator, title: string) {
  const name = { name: `Pin ${title} to top`, exact: true };
  await inbox
    .getByRole("listitem")
    .filter({
      has: inbox.page().getByRole("button", name),
    })
    .hover();
  const pin = inbox.getByRole("button", name);
  await pin.click();
  await expect(pin).toHaveAttribute("aria-pressed", "true");
}

export async function dragPinnedChat(
  page: Page,
  source: Locator,
  target: Locator,
  touch = false
) {
  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();
  const [start, end] = await Promise.all([
    source.boundingBox(),
    target.boundingBox(),
  ]);
  if (!start || !end) throw new Error("Both pinned rows must be visible");
  const x = Math.round(start.x + start.width / 2);
  const startY = Math.round(start.y + start.height / 2);
  const endY = Math.round(end.y + end.height / 2);
  if (!touch) {
    await page.mouse.move(x, startY);
    await page.mouse.down();
    try {
      await page.mouse.move(x, endY, { steps: 12 });
    } finally {
      await page.mouse.up();
    }
    return;
  }

  const client = await page.context().newCDPSession(page);
  try {
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y: startY }],
    });
    // Hold past the gesture's activation delay before moving vertically.
    await new Promise((resolve) => setTimeout(resolve, 250));
    for (let step = 1; step <= 12; step++) {
      await client.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: startY + ((endY - startY) * step) / 12 }],
      });
    }
    await client.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  } finally {
    await client.detach();
  }
}
