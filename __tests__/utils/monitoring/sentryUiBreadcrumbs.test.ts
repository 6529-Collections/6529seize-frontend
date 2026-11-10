import {
  sanitizeSentryBreadcrumb,
  sanitizeSentryEvent,
} from "@/utils/sentry-sanitizer";
import { stripUiBreadcrumbLabels } from "@/utils/monitoring/sentryUiBreadcrumbs";

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
    require.resolve("@sentry/core", {
      paths: [require.resolve("@sentry/nextjs")],
    })
  );

  it("keeps tag and classes of a labelled element with a role, without its label", () => {
    document.body.innerHTML = `<div class="tw-flex row"><span id="send" role="button" class="tw-btn primary" aria-label="Reply to Ann in Night Owls" title="Ann">Ann</span></div>`;
    const element = document.getElementById("send")!;

    const message = sanitizeSentryBreadcrumb(
      { category: "ui.click", message: htmlTreeAsString(element) },
      "/messages"
    )?.message;

    // The SDK stops at 80 characters of path before label text is removed,
    // so this long label leaves no room for the parent.
    expect(message).toBe("span#send.tw-btn.primary[aria-label][title]");
    expect(message).not.toMatch(/Ann|Night Owls/);
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
