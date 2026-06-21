import { expect, type Page } from "@playwright/test";

export type FocusSummary = {
  readonly ariaLabel: string | null;
  readonly id: string | null;
  readonly role: string | null;
  readonly tagName: string;
  readonly text: string;
};

type FocusVisibleOptions = {
  readonly maxTabs?: number;
  readonly timeout?: number;
};

export async function pressTab(page: Page, count = 1) {
  for (let index = 0; index < count; index += 1) {
    await page.keyboard.press("Tab");
  }
}

export async function expectKeyboardFocusVisibleWithinTabs(
  page: Page,
  options: FocusVisibleOptions = {}
) {
  const maxTabs = options.maxTabs ?? 8;
  const timeout = options.timeout ?? 5000;

  for (let tabIndex = 0; tabIndex < maxTabs; tabIndex += 1) {
    await pressTab(page);

    if (await hasVisibleFocus(page, timeout)) {
      return getFocusedElementSummary(page);
    }
  }

  const focused = await getFocusedElementSummary(page);
  expect(
    false,
    `Expected visible keyboard focus within ${maxTabs} Tab presses. Last focus: ${JSON.stringify(
      focused
    )}`
  ).toBe(true);
  return focused;
}

export async function getFocusedElementSummary(
  page: Page
): Promise<FocusSummary> {
  return page.evaluate(() => {
    const activeElement = document.activeElement;

    if (!(activeElement instanceof HTMLElement)) {
      return {
        ariaLabel: null,
        id: null,
        role: null,
        tagName: "",
        text: "",
      };
    }

    return {
      ariaLabel: activeElement.getAttribute("aria-label"),
      id: activeElement.id || null,
      role: activeElement.getAttribute("role"),
      tagName: activeElement.tagName.toLowerCase(),
      text: (activeElement.innerText || activeElement.textContent || "")
        .trim()
        .slice(0, 80),
    };
  });
}

async function hasVisibleFocus(page: Page, timeout: number) {
  return page
    .waitForFunction(
      () => {
        const activeElement = document.activeElement;

        if (!(activeElement instanceof HTMLElement)) {
          return false;
        }

        if (activeElement === document.body) {
          return false;
        }

        const style = window.getComputedStyle(activeElement);
        const outlineWidth = Number.parseFloat(style.outlineWidth || "0");
        const hasOutline =
          style.outlineStyle !== "none" &&
          style.outlineColor !== "transparent" &&
          outlineWidth > 0;
        const hasBoxShadow =
          style.boxShadow !== "none" && style.boxShadow.trim().length > 0;

        return hasOutline || hasBoxShadow;
      },
      undefined,
      { timeout }
    )
    .then(() => true)
    .catch(() => false);
}
