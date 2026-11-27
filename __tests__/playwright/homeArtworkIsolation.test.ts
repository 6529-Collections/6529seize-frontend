import type { Page, Route } from "@playwright/test";
import { isolateHomeArtworkDocuments } from "../../tests/support/homeArtworkIsolation";

async function fixture({
  method = "GET",
  resourceType = "document",
  navigation = true,
  parent = "main",
  homeArtwork = true,
}: {
  method?: string;
  resourceType?: string;
  navigation?: boolean;
  parent?: "main" | "nested" | "none";
  homeArtwork?: boolean;
} = {}) {
  const mainFrame = {};
  const container = document.createElement("section");
  if (homeArtwork) container.setAttribute("data-home-drop", "next");
  const iframe = document.createElement("iframe");
  container.append(iframe);
  const element = {
    evaluate: jest.fn(async (callback: (node: Element) => boolean) =>
      callback(iframe)
    ),
    dispose: jest.fn(async () => undefined),
  };
  const frame = {
    parentFrame: () => {
      if (parent === "main") return mainFrame;
      return parent === "nested" ? {} : null;
    },
    frameElement: jest.fn(async () => element),
    isDetached: jest.fn(() => false),
  };
  const route = {
    request: () => ({
      method: () => method,
      resourceType: () => resourceType,
      isNavigationRequest: () => navigation,
      frame: () => frame,
    }),
    fallback: jest.fn(async () => undefined),
    fulfill: jest.fn(
      async (_options: { contentType: string; body: string }) => undefined
    ),
    abort: jest.fn(async () => undefined),
  };
  let handler!: (route: Route) => Promise<void>;
  const register = jest.fn(
    async (_pattern: string, callback: (route: Route) => Promise<void>) => {
      handler = callback;
    }
  );
  const page = {
    route: register,
    mainFrame: () => mainFrame,
  } as unknown as Page;
  await isolateHomeArtworkDocuments(page);
  return {
    element,
    frame,
    register,
    route,
    run: () => handler(route as unknown as Route),
  };
}

it("fulfills only a direct homepage artwork document with script-free HTML", async () => {
  const { element, register, route, run } = await fixture();
  await run();
  expect(register).toHaveBeenCalledWith("**/*", expect.any(Function));
  expect(route.fulfill).toHaveBeenCalledWith({
    contentType: "text/html",
    body: expect.stringContaining("Isolated homepage artwork fixture"),
  });
  expect(route.fulfill.mock.calls[0]?.[0].body).not.toContain("<script");
  expect(element.dispose).toHaveBeenCalledTimes(1);
  expect(route.fallback).not.toHaveBeenCalled();
});

it.each([
  { method: "POST" },
  { resourceType: "image" },
  { resourceType: "fetch", navigation: true },
  { resourceType: "fetch", navigation: false },
  { navigation: false },
  { parent: "none" as const },
  { parent: "nested" as const },
  { homeArtwork: false },
])(
  "leaves unrelated requests to the existing route/guard: %j",
  async (options) => {
    const { route, run } = await fixture(options);
    await run();
    expect(route.fallback).toHaveBeenCalledTimes(1);
    expect(route.fulfill).not.toHaveBeenCalled();
    expect(route.abort).not.toHaveBeenCalled();
  }
);

it("aborts an artwork request removed by hydration instead of loading live scripts", async () => {
  const { frame, route, run } = await fixture();
  frame.frameElement.mockRejectedValue(new Error("Frame detached"));
  frame.isDetached.mockReturnValue(true);
  await run();
  expect(route.abort).toHaveBeenCalledTimes(1);
  expect(route.fulfill).not.toHaveBeenCalled();
  expect(route.fallback).not.toHaveBeenCalled();
});

it("disposes the element and surfaces unexpected inspection errors", async () => {
  const { element, route, run } = await fixture();
  element.evaluate.mockRejectedValue(new Error("Unexpected failure"));
  await expect(run()).rejects.toThrow("Unexpected failure");
  expect(element.dispose).toHaveBeenCalledTimes(1);
  expect(route.fulfill).not.toHaveBeenCalled();
  expect(route.fallback).not.toHaveBeenCalled();
});

it("disposes and aborts when artwork detaches during element inspection", async () => {
  const { element, frame, route, run } = await fixture();
  element.evaluate.mockRejectedValue(new Error("Frame detached"));
  frame.isDetached.mockReturnValue(true);
  await run();
  expect(element.dispose).toHaveBeenCalledTimes(1);
  expect(route.abort).toHaveBeenCalledTimes(1);
  expect(route.fulfill).not.toHaveBeenCalled();
  expect(route.fallback).not.toHaveBeenCalled();
});

it("surfaces unexpected lookup failures while artwork is still attached", async () => {
  const { element, frame, route, run } = await fixture();
  frame.frameElement.mockRejectedValue(new Error("Unexpected lookup failure"));
  await expect(run()).rejects.toThrow("Unexpected lookup failure");
  expect(element.dispose).not.toHaveBeenCalled();
  expect(route.abort).not.toHaveBeenCalled();
  expect(route.fulfill).not.toHaveBeenCalled();
  expect(route.fallback).not.toHaveBeenCalled();
});
