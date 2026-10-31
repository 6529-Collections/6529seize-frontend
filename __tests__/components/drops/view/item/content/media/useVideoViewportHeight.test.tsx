import { act } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { useVideoViewportHeight } from "@/components/drops/view/item/content/media/useVideoViewportHeight";

function Height() {
  const height = useVideoViewportHeight();
  return <output>{height ?? "unknown"}</output>;
}

const setInnerHeight = (value: number) =>
  Object.defineProperty(globalThis.window, "innerHeight", {
    configurable: true,
    writable: true,
    value,
  });

it("hydrates against the server markup, then reports and tracks the viewport height", async () => {
  setInnerHeight(700);
  const container = document.createElement("div");
  container.innerHTML = renderToString(<Height />);
  expect(container.querySelector("output")).toHaveTextContent("unknown");

  const onRecoverableError = jest.fn();
  const consoleError = jest
    .spyOn(console, "error")
    .mockImplementation(() => undefined);
  let root: ReturnType<typeof hydrateRoot> | undefined;
  try {
    await act(async () => {
      root = hydrateRoot(container, <Height />, { onRecoverableError });
    });
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    expect(container.querySelector("output")).toHaveTextContent("700");

    await act(async () => {
      setInnerHeight(512);
      globalThis.window.dispatchEvent(new Event("resize"));
    });
    expect(container.querySelector("output")).toHaveTextContent("512");
  } finally {
    await act(async () => root?.unmount());
    consoleError.mockRestore();
  }
});
