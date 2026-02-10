import {
  __testing,
  shouldFilterByFilenameExceptions,
} from "@/utils/sentry-client-filters";

describe("sentry-client-filters", () => {
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
    const error = new Error("Cannot read properties of undefined (reading 'ton')");
    error.stack = `TypeError: Cannot read properties of undefined (reading 'ton')\n    at requestAccounts (app:///extensionServiceWorker.js:75067:1)`;

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
});
