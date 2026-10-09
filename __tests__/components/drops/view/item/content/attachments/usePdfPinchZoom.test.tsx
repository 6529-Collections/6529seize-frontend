import { fireEvent, renderHook } from "@testing-library/react";
import usePdfPinchZoom from "@/components/drops/view/item/content/attachments/usePdfPinchZoom";

it("magnifies around the reading position, keeps native one-finger scrolling, and cleans up", () => {
  const viewport = document.createElement("div");
  const content = document.createElement("div");
  content.style.zoom = "";
  viewport.append(content);
  viewport.scrollTop = 300;
  const contentRef = { current: content };
  const { unmount } = renderHook(() =>
    usePdfPinchZoom({ current: viewport }, contentRef, true)
  );
  const touches = (distance: number) => [
    { clientX: 150 - distance / 2, clientY: 200 },
    { clientX: 150 + distance / 2, clientY: 200 },
  ];
  expect(
    fireEvent.touchStart(viewport, {
      touches: [{ clientX: 100, clientY: 200 }],
    })
  ).toBe(true);
  expect(
    fireEvent.touchMove(viewport, { touches: [{ clientX: 100, clientY: 250 }] })
  ).toBe(true);
  fireEvent.touchStart(viewport, { touches: touches(100) });
  fireEvent.touchMove(viewport, { touches: touches(200) });
  expect(content.style.zoom).toBe("2");
  expect(viewport.scrollTop).toBe(800);
  expect(viewport.scrollLeft).toBe(150);
  fireEvent.touchMove(viewport, { touches: touches(1000) });
  expect(content.style.zoom).toBe("4");
  fireEvent.touchEnd(viewport);
  fireEvent.doubleClick(viewport, { clientX: 150, clientY: 200 });
  expect(content.style.zoom).toBe("1");
  expect(viewport.scrollTop).toBe(300);
  unmount();
  expect(content.style.zoom).toBe("");
  fireEvent.doubleClick(viewport);
  expect(content.style.zoom).toBe("");
});

it("leaves loading and error content unmodified", () => {
  const viewport = document.createElement("div");
  const content = document.createElement("div");
  content.style.zoom = "";
  renderHook(() =>
    usePdfPinchZoom({ current: viewport }, { current: content }, false)
  );
  fireEvent.doubleClick(viewport);
  expect(content.style.zoom).toBe("");
});
