/**
 * @jest-environment node
 */
import { getDesktopShellApi, isDesktopShell } from "@/helpers/desktop-shell";

describe("desktop-shell during server rendering", () => {
  it("is false without a window", () => {
    expect(typeof window).toBe("undefined");
    expect(isDesktopShell()).toBe(false);
    expect(getDesktopShellApi()).toBeNull();
  });
});
