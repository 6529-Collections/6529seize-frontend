import { renderHook } from "@testing-library/react";
import { useWaveDropsSerialScroll } from "@/components/waves/drops/wave-drops-all/hooks/useWaveDropsSerialScroll";

it("centers the exact reply when it mounts after its thread opened", () => {
  const container = document.createElement("div");
  const parent = document.createElement("div");
  const reply = document.createElement("div");
  container.appendChild(parent);
  parent.appendChild(reply);
  Object.defineProperties(container, {
    clientHeight: { value: 200 },
    scrollHeight: { value: 900 },
    scrollTo: { value: jest.fn() },
  });
  jest
    .spyOn(container, "getBoundingClientRect")
    .mockReturnValue(new DOMRect(0, 0, 300, 200));
  jest
    .spyOn(reply, "getBoundingClientRect")
    .mockReturnValue(new DOMRect(0, 650, 300, 40));

  const linkedReply = {
    parentDropId: "root",
    parentSerialNo: 10,
    replySerialNo: 12,
  };
  const getLinkedReplyElement = jest.fn().mockReturnValue(null);
  const scrollContainerRef = { current: container };
  const { rerender } = renderHook(
    ({ element }: { element: HTMLDivElement | null }) =>
      useWaveDropsSerialScroll({
        waveId: "wave",
        dropId: null,
        initialDrop: null,
        linkedReply,
        linkedReplyElement: element,
        getLinkedReplyElement,
        waveMessages: null,
        fetchNextPage: jest.fn(),
        waitAndRevealDrop: jest.fn(),
        scrollContainerRef,
        shouldPinToBottom: false,
        scrollToVisualBottom: jest.fn(),
      }),
    { initialProps: { element: null } }
  );

  expect(container.scrollTo).not.toHaveBeenCalled();
  getLinkedReplyElement.mockReturnValue(reply);
  rerender({ element: reply });
  expect(getLinkedReplyElement).toHaveBeenCalledWith(10);
  expect(container.scrollTo).toHaveBeenCalledWith({
    behavior: "auto",
    top: 570,
  });
});
