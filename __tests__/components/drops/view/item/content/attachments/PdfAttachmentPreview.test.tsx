import { fireEvent, render, screen } from "@testing-library/react";
import PdfAttachmentPreview from "@/components/drops/view/item/content/attachments/PdfAttachmentPreview";

jest.mock(
  "next/dynamic",
  () => () =>
    function Reader() {
      return <div>PDF document</div>;
    }
);

it("contains touch and keyboard gestures even when its portal is mounted inside a clickable drop", () => {
  const onTouchStart = jest.fn();
  const onPointerDown = jest.fn();
  const onKeyDown = jest.fn();
  render(
    <div
      role="button"
      tabIndex={0}
      onTouchStart={onTouchStart}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
    >
      <PdfAttachmentPreview
        open
        url="https://example.test/document.pdf"
        fileName="document.pdf"
        onClose={jest.fn()}
      />
    </div>
  );
  const content = screen.getByText("PDF document");
  fireEvent.touchStart(content, { touches: [{ clientX: 10, clientY: 10 }] });
  fireEvent.pointerDown(content);
  fireEvent.keyDown(content, { key: "Enter" });
  fireEvent.keyDown(content, { key: " " });
  expect(onTouchStart).not.toHaveBeenCalled();
  expect(onPointerDown).not.toHaveBeenCalled();
  expect(onKeyDown).not.toHaveBeenCalled();
});
