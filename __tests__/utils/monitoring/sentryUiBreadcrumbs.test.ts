import {
  sanitizeSentryBreadcrumb,
  sanitizeSentryEvent,
} from "@/utils/sentry-sanitizer";
import type { Breadcrumb } from "@sentry/nextjs";
import {
  stripUiBreadcrumbLabels,
  withUiElementPath,
} from "@/utils/monitoring/sentryUiBreadcrumbs";

describe("UI breadcrumb labels", () => {
  it("keeps the selector structure and drops label values", () => {
    expect(
      stripUiBreadcrumbLabels(
        'div.tw-flex > button#send.tw-btn[aria-label="Reply to Ann"][type="button"][title="Ann in Night Owls"]'
      )
    ).toBe(
      'div.tw-flex > button#send.tw-btn[aria-label][type="button"][title]'
    );
    expect(
      stripUiBreadcrumbLabels(
        'img[alt="holiday.png"] > input[name="q"][placeholder="Search Ann"][value="x"]'
      )
    ).toBe('img[alt] > input[name="q"][placeholder][value]');
  });

  it("drops a label value that contains quotes and brackets", () => {
    expect(
      stripUiBreadcrumbLabels(
        'li > button[aria-label="say "hi"] to Bo"][type="button"]'
      )
    ).toBe('li > button[aria-label][type="button"]');
  });

  it("keeps test ids, roles, names and types", () => {
    const message =
      'div[data-testid="drop-actions"] > button[role="menuitem"][type="button"][name="react"]';
    expect(stripUiBreadcrumbLabels(message)).toBe(message);
  });

  it("strips labels from ui breadcrumbs only", () => {
    expect(
      sanitizeSentryBreadcrumb(
        {
          category: "ui.click",
          message: 'button[aria-label="Open chat with Ann"]',
        },
        "/messages"
      )?.message
    ).toBe("button[aria-label]");
    expect(
      sanitizeSentryBreadcrumb(
        {
          category: "ui.input",
          message: 'input[title="Wave name"]',
        },
        "/waves"
      )?.message
    ).toBe("input[title]");
    expect(
      sanitizeSentryBreadcrumb(
        { category: "console", message: 'logged [title="kept"]' },
        "/"
      )?.message
    ).toBe('logged [title="kept"]');
  });

  it("strips labels from breadcrumbs attached to an event", () => {
    const event = sanitizeSentryEvent({
      breadcrumbs: [
        { category: "ui.click", message: 'a[aria-label="Private wave"]' },
      ],
    });
    expect(event.breadcrumbs?.[0]?.message).toBe("a[aria-label]");
  });
});

describe("UI breadcrumbs from the installed SDK", () => {
  // The selector builder the browser SDK uses for click and input breadcrumbs.
  const { htmlTreeAsString } = jest.requireActual<{
    htmlTreeAsString: (element: Element) => string;
  }>(
    // Resolved through @sentry/nextjs, whose version it is; the package is
    // not a direct dependency of the app.
    require.resolve(["@sentry", "core"].join("/"), {
      paths: [require.resolve("@sentry/nextjs")],
    })
  );

  /** What beforeBreadcrumb receives for a click: the SDK's path and event. */
  function clickBreadcrumb(element: Element): Breadcrumb | null {
    let event: Event | undefined;
    document.addEventListener("click", (e) => (event = e), { once: true });
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    return sanitizeSentryBreadcrumb(
      withUiElementPath(
        { category: "ui.click", message: htmlTreeAsString(element) },
        { event, name: "click", global: true }
      ),
      "/messages"
    );
  }

  it.each([
    "Reply to Ann in Night Owls",
    'a"][b',
    'x"] > y',
    'ends with"]',
    "two\nlines",
  ])("keeps tag, id and classes of a labelled element: %j", (label) => {
    document.body.innerHTML = `<div class="tw-flex row"><span id="send" role="button" class="tw-btn primary" title="Ann">Ann</span></div>`;
    const element = document.getElementById("send")!;
    element.setAttribute("aria-label", label);

    const message = clickBreadcrumb(element)?.message;

    expect(message).toBe("body > div.tw-flex.row > span#send.tw-btn.primary");
  });

  it("uses the element itself when the hint carries it instead of an event", () => {
    document.body.innerHTML = `<input class="search" aria-label="Find Ann">`;
    const input = document.querySelector("input")!;
    expect(
      withUiElementPath(
        { category: "ui.input", message: 'input[aria-label="Find Ann"]' },
        { event: input, name: "input" }
      ).message
    ).toBe("body > input.search");
  });
});

describe("UI breadcrumbs without an element", () => {
  const sanitize = (message: string, hint?: Record<string, unknown>) =>
    sanitizeSentryBreadcrumb(
      withUiElementPath({ category: "ui.click", message }, hint),
      "/waves"
    )?.message;

  it.each([
    ['button[aria-label="a"][b"][type="button"]'],
    ['li > button[aria-label="x"] > y"]'],
    ['button[title="two\nlines"] > [alt=x'],
    ['button[type="button"]'],
  ])("replaces a path that may still hold label text: %j", (message) => {
    expect(sanitize(message)).toBe("ui.click");
  });

  it("keeps a path whose labels were fully removed", () => {
    expect(sanitize('div.row > button.tw-btn[aria-label="Ann"]')).toBe(
      "div.row > button.tw-btn[aria-label]"
    );
    // A label ending in `"]` at the end of the path is removed whole.
    expect(sanitize('button[aria-label="ends with"]"]')).toBe(
      "button[aria-label]"
    );
  });

  it("falls back when the hint target is not an element", () => {
    const event = new Event("keypress");
    Object.defineProperty(event, "target", { value: document });
    expect(sanitize('input[aria-label="Ann"]', { event })).toBe(
      "input[aria-label]"
    );
    expect(sanitize('input[aria-label="Ann"]', { event: { target: 1 } })).toBe(
      "input[aria-label]"
    );
  });

  it("leaves other breadcrumbs to the sanitizer", () => {
    const breadcrumb = { category: "console", message: 'x [title="y"]' };
    expect(withUiElementPath(breadcrumb, { event: document.body })).toBe(
      breadcrumb
    );
  });
});

describe("culture context", () => {
  it("removes the culture context and keeps the others", () => {
    const event = sanitizeSentryEvent({
      contexts: {
        culture: {
          locale: "fi-FI",
          timezone: "Europe/Helsinki",
          calendar: "gregory",
        },
        browser: { name: "Chrome" },
      },
    });
    expect(event.contexts).toEqual({ browser: { name: "Chrome" } });
  });

  it("filters the request language header and keeps other headers", () => {
    const event = sanitizeSentryEvent({
      request: {
        url: "https://6529.io/",
        headers: {
          "Accept-Language": "fi-FI,fi;q=0.9",
          "user-agent": "Synthetic",
        },
      },
    });
    expect(event.request?.headers).toEqual({
      "Accept-Language": "[Filtered]",
      "user-agent": "Synthetic",
    });
  });
});
