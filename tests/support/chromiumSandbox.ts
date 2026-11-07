// Playwright launches Chromium with --no-sandbox unless told otherwise, so a
// renderer exploit in any page under test would run with the developer's full
// privileges. Keep the sandbox on where Chromium supports it. Linux CI runs
// Chromium as root in containers or under AppArmor user-namespace limits,
// where the sandbox cannot start.
export const CHROMIUM_SANDBOX = process.platform !== "linux";
