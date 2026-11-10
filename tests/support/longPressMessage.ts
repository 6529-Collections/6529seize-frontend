import type { Locator, Page } from "@playwright/test";
import { expect } from "../testHelpers";

export async function longPressMessage(page: Page, target: Locator) {
  await target.click({ trial: true });
  const bounds = await target.boundingBox();
  if (!bounds) throw new Error("Message must be visible for a long press");
  const touch = await page.context().newCDPSession(page);
  try {
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [
        { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 },
      ],
    });
    await expect(
      page
        .getByRole("dialog", { name: "Drop actions", exact: true })
        .getByRole("button", { name: "Reply", exact: true })
    ).toBeVisible();
  } finally {
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await touch.detach();
  }
}
