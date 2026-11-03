/** @jest-environment node */
import { preloadOnFirstInteraction } from "@/components/utils/lazy-load/preloadOnFirstInteraction";

describe("preloadOnFirstInteraction on the server", () => {
  it("registers nothing and never runs the task", () => {
    const task = jest.fn();

    expect(() => preloadOnFirstInteraction(task)).not.toThrow();

    expect(task).not.toHaveBeenCalled();
  });
});
