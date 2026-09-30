import { runInNewContext } from "node:vm";
import { SIDEBAR_STARTUP_SCRIPT } from "@/components/layout/sidebarStartup";

it.each([
  ["false", true],
  [" false ", true],
  ["true", false],
  [null, false],
  ["invalid", false],
  ['"false"', false],
  ["0", false],
] as const)(
  "restores only a saved expanded boolean: %s",
  (stored, expanded) => {
    const setAttribute = jest.fn();
    const getItem = jest.fn(() => stored);
    runInNewContext(SIDEBAR_STARTUP_SCRIPT, {
      sessionStorage: { getItem },
      document: { documentElement: { setAttribute } },
    });
    expect(getItem).toHaveBeenCalledWith("sidebarCollapsed");
    if (expanded) {
      expect(setAttribute).toHaveBeenCalledWith(
        "data-sidebar-startup",
        "expanded"
      );
    } else {
      expect(setAttribute).not.toHaveBeenCalled();
    }
  }
);

it("leaves normal rendering available when storage access is blocked", () => {
  const setAttribute = jest.fn();
  expect(() =>
    runInNewContext(SIDEBAR_STARTUP_SCRIPT, {
      get sessionStorage() {
        throw new Error("Storage blocked");
      },
      document: { documentElement: { setAttribute } },
    })
  ).not.toThrow();
  expect(setAttribute).not.toHaveBeenCalled();
});
