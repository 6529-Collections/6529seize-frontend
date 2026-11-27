import type { Page, Route } from "@playwright/test";
import { installHomeArtworkFixture } from "../../tests/support/homeArtworkFixture";

async function createHarness() {
  const element = {
    evaluate: jest.fn(async () => true),
    dispose: jest.fn(async () => undefined),
  };
  const frame = {
    parentFrame: () => ({}),
    isDetached: jest.fn(() => false),
    frameElement: jest.fn(async () => element),
  };
  const route = {
    request: () => ({
      method: () => "GET",
      isNavigationRequest: () => true,
      resourceType: () => "document",
      frame: () => frame,
    }),
    fallback: jest.fn(async () => undefined),
    fulfill: jest.fn(async () => undefined),
  };
  let handler!: (route: Route) => Promise<void>;
  const page = {
    route: async (_pattern: string, callback: typeof handler) => {
      handler = callback;
    },
  } as unknown as Page;
  const fixture = await installHomeArtworkFixture(page);
  return {
    element,
    frame,
    route,
    fixture,
    run: () => handler(route as unknown as Route),
  };
}

describe("Homepage artwork fixture frame lifecycle", () => {
  it("fulfills matching artwork and releases its element handle", async () => {
    const { element, route, fixture, run } = await createHarness();
    await run();
    expect(element.dispose).toHaveBeenCalledTimes(1);
    expect(route.fulfill).toHaveBeenCalledTimes(1);
    expect(route.fallback).not.toHaveBeenCalled();
    expect(fixture.documentsReplaced()).toBe(1);
  });

  it("falls back when the frame detaches before its element is returned", async () => {
    const { frame, element, route, fixture, run } = await createHarness();
    frame.frameElement.mockRejectedValueOnce(new Error("Frame was detached"));
    frame.isDetached.mockReturnValue(true);
    await expect(run()).resolves.toBeUndefined();
    expect(route.fallback).toHaveBeenCalledTimes(1);
    expect(route.fulfill).not.toHaveBeenCalled();
    expect(element.dispose).not.toHaveBeenCalled();
    expect(fixture.documentsReplaced()).toBe(0);
  });

  it("releases the handle and falls back if the frame detaches during inspection", async () => {
    const { frame, element, route, fixture, run } = await createHarness();
    element.evaluate.mockRejectedValueOnce(new Error("Frame was detached"));
    frame.isDetached.mockReturnValue(true);
    await expect(run()).resolves.toBeUndefined();
    expect(element.dispose).toHaveBeenCalledTimes(1);
    expect(route.fallback).toHaveBeenCalledTimes(1);
    expect(route.fulfill).not.toHaveBeenCalled();
    expect(fixture.documentsReplaced()).toBe(0);
  });

  it.each(["lookup", "inspection"])(
    "does not suppress an unexpected %s failure while the frame remains attached",
    async (phase) => {
      const { frame, element, route, run } = await createHarness();
      const failure = new Error("Unexpected fixture failure");
      if (phase === "lookup") frame.frameElement.mockRejectedValueOnce(failure);
      else element.evaluate.mockRejectedValueOnce(failure);
      await expect(run()).rejects.toBe(failure);
      expect(route.fallback).not.toHaveBeenCalled();
      expect(route.fulfill).not.toHaveBeenCalled();
      expect(element.dispose).toHaveBeenCalledTimes(phase === "lookup" ? 0 : 1);
    }
  );

  it("leaves unrelated iframe documents unchanged", async () => {
    const { element, route, fixture, run } = await createHarness();
    element.evaluate.mockResolvedValueOnce(false);
    await run();
    expect(element.dispose).toHaveBeenCalledTimes(1);
    expect(route.fallback).toHaveBeenCalledTimes(1);
    expect(route.fulfill).not.toHaveBeenCalled();
    expect(fixture.documentsReplaced()).toBe(0);
  });
});
