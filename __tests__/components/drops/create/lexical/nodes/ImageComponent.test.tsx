import { fireEvent, render, screen } from "@testing-library/react";
import ImageComponent from "@/components/drops/create/lexical/nodes/ImageComponent";
import { CLICK_COMMAND } from "lexical";

const selectNext = jest.fn();
const remove = jest.fn();
const clearSelection = jest.fn();
const setSelected = jest.fn();
const editor = {
  update: (run: () => void) => run(),
  registerCommand: jest.fn(
    (_command: unknown, _handler: (event: MouseEvent) => boolean) => () => {}
  ),
  isEditable: jest.fn(() => true),
  focus: jest.fn(),
  getRootElement: () => null,
};

jest.mock("@lexical/react/LexicalComposerContext", () => ({
  useLexicalComposerContext: () => [editor],
}));
jest.mock("@lexical/react/useLexicalNodeSelection", () => ({
  useLexicalNodeSelection: () => [false, setSelected, clearSelection],
}));
jest.mock("@lexical/react/useLexicalEditable", () => ({
  __esModule: true,
  default: () => true,
}));
jest.mock("lexical", () => ({
  ...jest.requireActual("lexical"),
  $getNodeByKey: () => ({ getType: () => "image", selectNext, remove }),
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

beforeEach(() => {
  jest.clearAllMocks();
  editor.isEditable.mockReturnValue(true);
});

describe("ImageComponent", () => {
  it("shows the local preview until the remote image is ready", () => {
    const { rerender } = render(
      <ImageComponent nodeKey="image" src="loading" previewSrc="blob:local" />
    );
    expect(screen.getByRole("img")).toHaveAttribute("src", "blob:local");
    expect(
      screen.queryByRole("button", { name: "View full image" })
    ).not.toBeInTheDocument();
    rerender(
      <ImageComponent nodeKey="image" src="https://example.com/image.png" />
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "https://example.com/image.png"
    );
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("selects an image and removes it at its existing position", () => {
    render(
      <ImageComponent nodeKey="image" src="https://example.com/image.png" />
    );
    const selectImage = editor.registerCommand.mock.calls.find(
      ([command]) => command === CLICK_COMMAND
    )?.[1];
    expect(
      selectImage?.({
        target: screen.getByRole("button", { name: "Select image" }),
      } as unknown as MouseEvent)
    ).toBe(true);
    expect(clearSelection).toHaveBeenCalled();
    expect(setSelected).toHaveBeenCalledWith(true);
    fireEvent.click(screen.getByRole("button", { name: "Remove image" }));
    expect(selectNext).toHaveBeenCalled();
    expect(remove).toHaveBeenCalled();
    expect(editor.focus).toHaveBeenCalled();
  });

  it("does not remove an image if the editor becomes read-only before React updates", () => {
    render(
      <ImageComponent nodeKey="image" src="https://example.com/image.png" />
    );
    editor.isEditable.mockReturnValue(false);
    fireEvent.click(screen.getByRole("button", { name: "Remove image" }));
    expect(remove).not.toHaveBeenCalled();
    expect(editor.focus).not.toHaveBeenCalled();
  });
});
