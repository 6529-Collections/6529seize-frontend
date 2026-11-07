import { useUnreadDividerVisibility } from "@/components/waves/drops/useUnreadDividerVisibility";
import {
  WAVE_DROPS_END_ANCHORED_SCROLL_CONTAINER,
  WAVE_DROPS_SCROLL_CONTAINER_ATTRIBUTE,
} from "@/helpers/waves/wave-visible-serial.helpers";
import { renderHook } from "@testing-library/react";

const rect = (top: number, bottom: number) =>
  ({ top, bottom, height: bottom - top }) as DOMRect;

const buildContainer = (attribute: string) => {
  const container = document.createElement("div");
  container.setAttribute(WAVE_DROPS_SCROLL_CONTAINER_ATTRIBUTE, attribute);
  container.getBoundingClientRect = () => rect(0, 600);
  const row = document.createElement("div");
  row.id = "drop-7";
  row.getBoundingClientRect = () => rect(-400, -300);
  container.appendChild(row);
  document.body.appendChild(container);
  return container;
};

describe("useUnreadDividerVisibility", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it.each([
    ["the reversed chat", "true", true],
    ["the windowed chat", WAVE_DROPS_END_ANCHORED_SCROLL_CONTAINER, false],
  ])(
    "places the unread divider on mount in %s",
    (_name, attribute, dispatchesScroll) => {
      const container = buildContainer(attribute);
      const onScroll = jest.fn();
      container.addEventListener("scroll", onScroll);

      const { result } = renderHook(() =>
        useUnreadDividerVisibility({
          unreadDividerSerialNo: 7,
          scrollContainerRef: { current: container },
          onDismissUnread: jest.fn(),
        })
      );

      expect(result.current.unreadPosition).toBe("above");
      // The windowed chat's virtualizer must not see a synthetic scroll from
      // inside a React effect.
      expect(onScroll.mock.calls.length > 0).toBe(dispatchesScroll);
    }
  );
});
