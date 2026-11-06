import { fireEvent, render, screen } from "@testing-library/react";
import { useChatFileDrop } from "@/hooks/useChatFileDrop";

function Chat({ onFiles }: { readonly onFiles: (files: File[]) => void }) {
  const drop = useChatFileDrop({ onFiles });
  return (
    <section aria-label="chat" {...drop.handlers}>
      <div>{drop.active ? "Drop files here" : "chat content"}</div>
      <textarea aria-label="editor" />
    </section>
  );
}

it("keeps normal chat's editor drops separate and clears nested drags on drop or cancel", () => {
  const onFiles = jest.fn();
  render(<Chat onFiles={onFiles} />);
  const area = screen.getByRole("region", { name: "chat" });
  const file = new File(["image"], "picture.png", { type: "image/png" });
  const dataTransfer = { types: ["Files"], files: [file] };
  fireEvent.dragEnter(area, { dataTransfer });
  const child = screen.getByText("Drop files here");
  fireEvent.dragEnter(child, { dataTransfer });
  fireEvent.dragLeave(child, { dataTransfer });
  expect(screen.getByText("Drop files here")).toBeVisible();
  fireEvent.drop(area, { dataTransfer });
  expect(onFiles).toHaveBeenCalledWith([file]);
  expect(screen.queryByText("Drop files here")).not.toBeInTheDocument();
  fireEvent.drop(screen.getByRole("textbox"), { dataTransfer });
  fireEvent.drop(area, { dataTransfer: { types: ["text/plain"], files: [] } });
  expect(onFiles).toHaveBeenCalledTimes(1);
  fireEvent.dragEnter(area, { dataTransfer });
  fireEvent.dragEnd(globalThis.window);
  expect(screen.queryByText("Drop files here")).not.toBeInTheDocument();
});
