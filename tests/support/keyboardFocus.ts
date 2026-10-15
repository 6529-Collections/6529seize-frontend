import { expect, type Locator, type Page } from "@playwright/test";

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

type FocusIndicatorReadout = {
  readonly tagName: string;
  readonly text: string;
  readonly focusVisible: boolean;
  readonly outlineVisible: boolean;
  readonly ringVisible: boolean;
  readonly outline: string;
};

type TabToElementOptions = {
  readonly maxTabs?: number;
};

type FocusedLinksOptions = {
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

async function tabToElement(
  page: Page,
  target: Locator,
  options: TabToElementOptions = {}
) {
  const maxTabs = options.maxTabs ?? 80;

  for (let tabIndex = 0; tabIndex < maxTabs; tabIndex += 1) {
    await pressTab(page);

    if (
      await target.evaluate((element) => element === document.activeElement)
    ) {
      return;
    }
  }

  expect(
    false,
    `Expected keyboard Tab traversal to reach the target within ${maxTabs} Tab presses.`
  ).toBe(true);
}

/**
 * Tabs to the target and asserts that it paints a real outline while
 * `:focus-visible` matches. Box-shadow rings are deliberately not accepted, so
 * a global rule that cancels `focus-visible:tw-outline-*` on links fails here.
 */
export async function expectKeyboardFocusOutline(
  page: Page,
  target: Locator,
  options: TabToElementOptions = {}
) {
  await tabToElement(page, target, options);

  await expect
    .poll(() => readActiveElementIndicator(page), {
      message: "Expected a visible outline on the keyboard-focused target",
      timeout: 5000,
    })
    .toMatchObject({ focusVisible: true, outlineVisible: true });
}

/**
 * Presses the pointer down on the target without completing a click, then
 * asserts that pointer focus does not paint an outline.
 */
export async function expectNoOutlineOnPointerFocus(
  page: Page,
  target: Locator
) {
  await target.hover();
  await page.mouse.down();

  try {
    await expect(target).toBeFocused();
    await expect
      .poll(() => readActiveElementIndicator(page), {
        message: "Expected no outline on the pointer-focused target",
        timeout: 5000,
      })
      .toMatchObject({ focusVisible: false, outlineVisible: false });
  } finally {
    // Release away from the target so the press never becomes a navigation.
    await page.mouse.move(0, 0);
    await page.mouse.up();
  }
}

/**
 * Tabs through the page and asserts that every focused link paints an outline
 * or a box-shadow ring. Native fallbacks count, so links without author focus
 * styles pass as long as nothing cancels the browser default. Pseudo-element
 * rings are not detected, so point this at pages that do not rely on them.
 */
export async function expectFocusedLinksShowIndicator(
  page: Page,
  options: FocusedLinksOptions = {}
) {
  const maxTabs = options.maxTabs ?? 40;
  const timeout = options.timeout ?? 2000;
  const missing: string[] = [];
  let linkStops = 0;

  for (let tabIndex = 0; tabIndex < maxTabs; tabIndex += 1) {
    await pressTab(page);

    const focused = await readActiveElementIndicator(page);
    if (focused?.tagName !== "a") {
      continue;
    }

    linkStops += 1;
    if (!(await waitForLinkIndicator(page, timeout))) {
      missing.push(
        `${focused.text || "(no text)"}: outline ${focused.outline}, ring ${focused.ringVisible}`
      );
    }
  }

  expect(linkStops, "Expected Tab traversal to reach links").toBeGreaterThan(0);
  expect(
    missing,
    "Links focused by keyboard without a visible indicator"
  ).toEqual([]);
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

async function waitForLinkIndicator(page: Page, timeout: number) {
  // Rings and outlines may transition in, so allow them a moment to settle.
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const focused = await readActiveElementIndicator(page);
    if (focused?.outlineVisible || focused?.ringVisible) {
      return true;
    }
    await page.waitForTimeout(50);
  }

  return false;
}

function readActiveElementIndicator(
  page: Page
): Promise<FocusIndicatorReadout | null> {
  return page.evaluate(() => {
    const element = document.activeElement;

    if (!(element instanceof HTMLElement) || element === document.body) {
      return null;
    }

    // Computed colours serialise as rgb(...) or rgba(..., alpha); no alpha
    // channel means fully opaque.
    const hasPaint = (colour: string) => {
      const alpha = /^rgba\((?:[^,]+,){3}\s*([\d.]+)\)$/.exec(colour)?.[1];
      return Number.parseFloat(alpha ?? "1") > 0;
    };
    const style = globalThis.getComputedStyle(element);
    const outlineVisible =
      style.outlineStyle !== "none" &&
      Number.parseFloat(style.outlineWidth || "0") > 0 &&
      hasPaint(style.outlineColor);
    // A ring is a painted, unblurred shadow layer with positive spread, as
    // produced by tw-ring-* utilities.
    const ringVisible = Array.from(
      style.boxShadow.matchAll(
        /(rgba?\([^)]*\))\s+-?[\d.]+px\s+-?[\d.]+px\s+([\d.]+)px\s+([\d.]+)px/g
      )
    ).some(
      ([, colour = "", blur = "0", spread = "0"]) =>
        hasPaint(colour) &&
        Number.parseFloat(blur) === 0 &&
        Number.parseFloat(spread) > 0
    );

    return {
      tagName: element.tagName.toLowerCase(),
      text: (element.innerText || element.getAttribute("aria-label") || "")
        .trim()
        .slice(0, 60),
      focusVisible: element.matches(":focus-visible"),
      outlineVisible,
      ringVisible,
      outline: `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`,
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

        const style = globalThis.getComputedStyle(activeElement);
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
