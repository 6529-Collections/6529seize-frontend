import {
  __testing,
  shouldFilterByFilenameExceptions,
  shouldFilterInjectedWalletCollision,
  shouldFilterTwitterConfigReferenceError,
} from "@/utils/sentry-client-filters";

describe("sentry-client-filters", () => {
  const createTwitterConfigEvent = (overrides: Record<string, unknown> = {}) =>
    ({
      exception: {
        values: [
          {
            type: "ReferenceError",
            value: "Can't find variable: CONFIG",
            stacktrace: {
              frames: [
                { filename: "app:///", abs_path: "app:///" },
                { filename: "app:///", abs_path: "app:///" },
              ],
            },
          },
        ],
      },
      contexts: {
        browser: {
          name: "Twitter",
        },
      },
      tags: {
        browser: "Twitter 11.62",
        "browser.name": "Twitter",
      },
      ...overrides,
    }) as any;

  const createInjectedWalletCollisionEvent = (
    overrides: Record<string, unknown> = {}
  ) =>
    ({
      exception: {
        values: [
          {
            type: "TypeError",
            value:
              "'set' on proxy: trap returned falsish for property 'tronlinkParams'",
            stacktrace: {
              frames: [
                {
                  filename: "app:///injected/injected.js",
                  abs_path: "app:///injected/injected.js",
                },
              ],
            },
          },
        ],
      },
      breadcrumbs: {
        values: [
          {
            category: "console",
            message:
              "[WagmiSetup] Failed to install safe ethereum proxy Error: Cannot set property ethereum of #<Window> which has only a getter",
            data: {
              arguments: [
                "[WagmiSetup] Failed to install safe ethereum proxy Error:",
                "Cannot set property ethereum of #<Window> which has only a getter",
              ],
            },
          },
        ],
      },
      ...overrides,
    }) as any;

  it("filters events when a stack frame matches a filename exception", () => {
    // Arrange
    const frames = [{ filename: "app:///extensionServiceWorker.js" } as any];

    // Act
    const result = shouldFilterByFilenameExceptions(frames);

    // Assert
    expect(result).toBe(true);
  });

  it("filters events when the original exception stack contains a filename exception", () => {
    // Arrange
    const error = new Error(
      "Cannot read properties of undefined (reading 'ton')"
    );
    error.stack = `TypeError: Cannot read properties of undefined (reading 'ton')\n    at requestAccounts (app:///extensionServiceWorker.js:75067:1)`;

    // Act
    const result = shouldFilterByFilenameExceptions(undefined, {
      originalException: error,
    });

    // Assert
    expect(result).toBe(true);
  });

  it("filters events when a stack frame matches extensionPageScript.js", () => {
    // Arrange
    const frames = [{ filename: "app:///extensionPageScript.js" } as any];

    // Act
    const result = shouldFilterByFilenameExceptions(frames);

    // Assert
    expect(result).toBe(true);
  });

  it("filters events when the original exception stack contains extensionPageScript.js", () => {
    // Arrange
    const error = new Error(
      "Cannot assign to read only property 'solana' of object '#<Window>'"
    );
    error.stack = `TypeError: Cannot assign to read only property 'solana' of object '#<Window>'\n    at foo (app:///extensionPageScript.js:4857:19)`;

    // Act
    const result = shouldFilterByFilenameExceptions(undefined, {
      originalException: error,
    });

    // Assert
    expect(result).toBe(true);
  });

  it("does not filter when frames do not match any filename exception", () => {
    // Arrange
    const frames = [{ filename: "app:///main.js" } as any];

    // Act
    const result = shouldFilterByFilenameExceptions(frames);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter when the original exception stack does not match any filename exception", () => {
    // Arrange
    const error = new Error("Some other error");
    error.stack = `Error: Some other error\n    at foo (app:///main.js:1:1)`;

    // Act
    const result = shouldFilterByFilenameExceptions(undefined, {
      originalException: error,
    });

    // Assert
    expect(result).toBe(false);
  });

  it("includes extensionServiceWorker.js in filename exceptions", () => {
    // Arrange
    const expected = "extensionServiceWorker.js";

    // Act
    const result = __testing.filenameExceptions;

    // Assert
    expect(result).toContain(expected);
  });

  it("includes extensionPageScript.js in filename exceptions", () => {
    // Arrange
    const expected = "extensionPageScript.js";

    // Act
    const result = __testing.filenameExceptions;

    // Assert
    expect(result).toContain(expected);
  });

  it("filters Twitter CONFIG reference errors with app URI frames", () => {
    // Arrange
    const event = createTwitterConfigEvent();

    // Act
    const result = shouldFilterTwitterConfigReferenceError(event);

    // Assert
    expect(result).toBe(true);
  });

  it("does not filter CONFIG reference errors outside Twitter", () => {
    // Arrange
    const event = createTwitterConfigEvent({
      contexts: { browser: { name: "Safari" } },
      tags: {
        browser: "Safari Mobile",
        "browser.name": "Safari",
      },
    });

    // Act
    const result = shouldFilterTwitterConfigReferenceError(event);

    // Assert
    expect(result).toBe(false);
  });

  it("filters CONFIG reference errors when Twitter is present only in tags", () => {
    // Arrange
    const event = createTwitterConfigEvent({
      contexts: {},
    });

    // Act
    const result = shouldFilterTwitterConfigReferenceError(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters injected wallet collisions for tronlinkParams in app URI stacks", () => {
    // Arrange
    const event = createInjectedWalletCollisionEvent();

    // Act
    const result = shouldFilterInjectedWalletCollision(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters injected wallet collisions from breadcrumb-only ethereum getter errors", () => {
    // Arrange
    const event = createInjectedWalletCollisionEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value: "Some wrapper error",
            stacktrace: {
              frames: [
                {
                  filename: "app:///injected/injected.js",
                  abs_path: "app:///injected/injected.js",
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterInjectedWalletCollision(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters injected wallet collisions when breadcrumbs are in Sentry array form", () => {
    // Arrange
    const event = createInjectedWalletCollisionEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value: "Some wrapper error",
            stacktrace: {
              frames: [
                {
                  filename: "app:///injected/injected.js",
                  abs_path: "app:///injected/injected.js",
                },
              ],
            },
          },
        ],
      },
      breadcrumbs: [
        {
          category: "console",
          message:
            "Cannot set property ethereum of #<Window> which has only a getter",
        },
      ],
    });

    // Act
    const result = shouldFilterInjectedWalletCollision(event);

    // Assert
    expect(result).toBe(true);
  });

  it("filters injected wallet collisions from the original exception stack", () => {
    // Arrange
    const event = createInjectedWalletCollisionEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value: "Some wrapper error",
          },
        ],
      },
      breadcrumbs: {
        values: [],
      },
    });
    const error = new Error(
      "Cannot set property ethereum of #<Window> which has only a getter"
    );
    error.stack = `TypeError: Cannot set property ethereum of #<Window> which has only a getter\n    at injected (app:///injected/injected.js:1:1)`;

    // Act
    const result = shouldFilterInjectedWalletCollision(event, {
      originalException: error,
    });

    // Assert
    expect(result).toBe(true);
  });

  it("filters injected wallet collisions when only abs_path has the injected app URI", () => {
    // Arrange
    const event = createInjectedWalletCollisionEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value:
              "'set' on proxy: trap returned falsish for property 'tronlinkParams'",
            stacktrace: {
              frames: [
                {
                  filename: "https://example.com/injected.js",
                  abs_path: "app:///injected/injected.js",
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterInjectedWalletCollision(event);

    // Assert
    expect(result).toBe(true);
  });

  it("does not filter injected wallet collisions when a web frame is present", () => {
    // Arrange
    const event = createInjectedWalletCollisionEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value:
              "'set' on proxy: trap returned falsish for property 'tronlinkParams'",
            stacktrace: {
              frames: [
                {
                  filename: "app:///injected/injected.js",
                  abs_path: "app:///injected/injected.js",
                },
                {
                  filename: "https://example.com/app.js",
                  abs_path: "https://example.com/app.js",
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterInjectedWalletCollision(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter unrelated app URI injected errors", () => {
    // Arrange
    const event = createInjectedWalletCollisionEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value: "Cannot read properties of undefined (reading 'foo')",
            stacktrace: {
              frames: [
                {
                  filename: "app:///injected/injected.js",
                  abs_path: "app:///injected/injected.js",
                },
              ],
            },
          },
        ],
      },
      breadcrumbs: {
        values: [
          {
            category: "console",
            message: "Random console error",
          },
        ],
      },
    });

    // Act
    const result = shouldFilterInjectedWalletCollision(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter non-reference errors from Twitter", () => {
    // Arrange
    const event = createTwitterConfigEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value: "Can't find variable: CONFIG",
            stacktrace: {
              frames: [{ filename: "app:///", abs_path: "app:///" }],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterTwitterConfigReferenceError(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter Twitter CONFIG errors when frames are not all app URIs", () => {
    // Arrange
    const event = createTwitterConfigEvent({
      exception: {
        values: [
          {
            type: "ReferenceError",
            value: "Can't find variable: CONFIG",
            stacktrace: {
              frames: [
                { filename: "app:///", abs_path: "app:///" },
                {
                  filename: "https://example.com/main.js",
                  abs_path: "https://example.com/main.js",
                },
              ],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterTwitterConfigReferenceError(event);

    // Assert
    expect(result).toBe(false);
  });

  it("does not filter unrelated app URI errors from Twitter", () => {
    // Arrange
    const event = createTwitterConfigEvent({
      exception: {
        values: [
          {
            type: "ReferenceError",
            value: "Can't find variable: SOMETHING_ELSE",
            stacktrace: {
              frames: [{ filename: "app:///", abs_path: "app:///" }],
            },
          },
        ],
      },
    });

    // Act
    const result = shouldFilterTwitterConfigReferenceError(event);

    // Assert
    expect(result).toBe(false);
  });

  it("detects app URI-only frame stacks in testing helpers", () => {
    // Arrange
    const frames = [{ filename: "app:///" }, { abs_path: "app:///" }] as any;

    // Act
    const result = __testing.hasOnlyAppUriFrames(frames);

    // Assert
    expect(result).toBe(true);
  });

  it("detects app URI-only frame stacks when only abs_path has the app URI", () => {
    // Arrange
    const frames = [
      {
        filename: "https://example.com/main.js",
        abs_path: "app:///main.js",
      },
      {
        filename: "app:///bootstrap.js",
        abs_path: "https://example.com/bootstrap.js",
      },
    ] as any;

    // Act
    const result = __testing.hasOnlyAppUriFrames(frames);

    // Assert
    expect(result).toBe(true);
  });
});
