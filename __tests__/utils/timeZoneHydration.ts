import type { ReactElement } from "react";
import { act } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";

type ToLocaleMethod = (
  this: Date,
  locales?: Intl.LocalesArgument,
  options?: Intl.DateTimeFormatOptions
) => string;

const withDefaultZone = (
  timeZone: string,
  options: Intl.DateTimeFormatOptions | undefined
): Intl.DateTimeFormatOptions => ({
  ...options,
  timeZone: options?.timeZone ?? timeZone,
});

const spyOnToLocaleMethod = (
  key: "toLocaleString" | "toLocaleDateString" | "toLocaleTimeString",
  timeZone: string
) => {
  const original: ToLocaleMethod = Date.prototype[key];
  const zoned: ToLocaleMethod = function (locales, options) {
    return original.call(this, locales, withDefaultZone(timeZone, options));
  };
  return jest.spyOn(Date.prototype, key).mockImplementation(zoned);
};

/**
 * Makes `timeZone` the resolved default zone for `Intl.DateTimeFormat` and the
 * `Date#toLocale*String` methods, as a browser in that zone would. Formatting
 * that passes an explicit `timeZone` keeps it. Local `Date` getters such as
 * `getHours()` still use the process zone. Returns a restore function.
 */
export function mockDefaultTimeZone(timeZone: string): () => void {
  const RealDateTimeFormat = Intl.DateTimeFormat;
  const spies = [
    jest
      .spyOn(Intl, "DateTimeFormat")
      .mockImplementation(
        (locales, options) =>
          new RealDateTimeFormat(locales, withDefaultZone(timeZone, options))
      ),
    spyOnToLocaleMethod("toLocaleString", timeZone),
    spyOnToLocaleMethod("toLocaleDateString", timeZone),
    spyOnToLocaleMethod("toLocaleTimeString", timeZone),
  ];

  return () => {
    for (const spy of spies) {
      spy.mockRestore();
    }
  };
}

export function renderToStringInTimeZone(
  element: ReactElement,
  timeZone: string
): string {
  const restore = mockDefaultTimeZone(timeZone);
  try {
    return renderToString(element);
  } finally {
    restore();
  }
}

export interface HydrationResult {
  readonly container: HTMLDivElement;
  readonly serverHtml: string;
  readonly recoverableErrors: readonly unknown[];
  readonly hydrationConsoleErrors: readonly string[];
  readonly cleanup: () => Promise<void>;
}

const isHydrationMessage = (args: readonly unknown[]): boolean =>
  args.some(
    (arg) =>
      (typeof arg === "string" || arg instanceof Error) &&
      /hydrat|did not match|server rendered/i.test(String(arg))
  );

/**
 * Renders server HTML with `serverTimeZone` as the default zone, then hydrates
 * it with `clientTimeZone` as the default zone. Call `beforeHydrate` to move a
 * mocked clock between the two renders. Collects every recoverable hydration
 * error and hydration console error so tests can assert there are none.
 */
export async function renderServerThenHydrate(
  element: ReactElement,
  {
    serverTimeZone,
    clientTimeZone,
    beforeHydrate,
  }: {
    readonly serverTimeZone: string;
    readonly clientTimeZone: string;
    readonly beforeHydrate?: (() => void) | undefined;
  }
): Promise<HydrationResult> {
  const serverHtml = renderToStringInTimeZone(element, serverTimeZone);
  const container = document.createElement("div");
  container.innerHTML = serverHtml;
  document.body.appendChild(container);
  beforeHydrate?.();

  const recoverableErrors: unknown[] = [];
  const hydrationConsoleErrors: string[] = [];
  const consoleError = jest
    .spyOn(console, "error")
    .mockImplementation((...args: unknown[]) => {
      if (isHydrationMessage(args)) {
        hydrationConsoleErrors.push(args.map(String).join(" "));
      }
    });
  const restoreTimeZone = mockDefaultTimeZone(clientTimeZone);
  let root: Root | undefined;
  await act(async () => {
    root = hydrateRoot(container, element, {
      onRecoverableError: (error) => {
        recoverableErrors.push(error);
      },
    });
  });

  return {
    container,
    serverHtml,
    recoverableErrors,
    hydrationConsoleErrors,
    cleanup: async () => {
      await act(async () => root?.unmount());
      container.remove();
      restoreTimeZone();
      consoleError.mockRestore();
    },
  };
}
