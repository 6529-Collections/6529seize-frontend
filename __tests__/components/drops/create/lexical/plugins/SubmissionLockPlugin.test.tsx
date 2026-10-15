import { useLayoutEffect } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  type LexicalEditor,
} from "lexical";
import SubmissionLockPlugin from "@/components/drops/create/lexical/plugins/SubmissionLockPlugin";

jest.unmock("lexical");

const originalRangeRect = Object.getOwnPropertyDescriptor(
  Range.prototype,
  "getBoundingClientRect"
);
beforeAll(() => {
  // jsdom has no range layout; Lexical reads this when scrolling the caret.
  Object.defineProperty(Range.prototype, "getBoundingClientRect", {
    configurable: true,
    value: () => new DOMRect(),
  });
});
afterAll(() => {
  if (originalRangeRect) {
    Object.defineProperty(
      Range.prototype,
      "getBoundingClientRect",
      originalRangeRect
    );
  } else {
    Reflect.deleteProperty(Range.prototype, "getBoundingClientRect");
  }
});

let testEditor: LexicalEditor;
function CaptureEditor() {
  const [editor] = useLexicalComposerContext();
  useLayoutEffect(() => {
    testEditor = editor;
  }, [editor]);
  return null;
}
function Editor({ locked }: { readonly locked: boolean }) {
  return (
    <LexicalComposer
      initialConfig={{
        namespace: "submission-lock-test",
        onError: (error) => {
          throw error;
        },
        editorState: () => {
          $getRoot().append(
            $createParagraphNode().append($createTextNode("Submitted draft"))
          );
        },
      }}
    >
      <PlainTextPlugin
        contentEditable={<ContentEditable ariaLabel="Draft" tabIndex={0} />}
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <CaptureEditor />
      <SubmissionLockPlugin locked={locked} />
    </LexicalComposer>
  );
}

it("keeps the focused input editable while blocking pending draft changes", async () => {
  const { rerender } = render(<Editor locked={false} />);
  const input = screen.getByRole("textbox");
  await act(async () => {
    input.focus();
    testEditor.focus();
  });
  rerender(<Editor locked={true} />);
  expect(input).toHaveFocus();
  expect(input).toHaveAttribute("contenteditable", "true");
  expect(input).toHaveAttribute("aria-readonly", "true");
  expect(
    fireEvent(
      input,
      new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: "x",
      })
    )
  ).toBe(false);
  expect(fireEvent.paste(input)).toBe(false);
  expect(fireEvent.keyDown(input, { key: "Backspace" })).toBe(false);
  expect(fireEvent.keyDown(input, { key: "c", metaKey: true })).toBe(true);
  await act(async () => {
    testEditor.update(
      () => {
        $getRoot()
          .clear()
          .append(
            $createParagraphNode().append($createTextNode("Unexpected edit"))
          );
      },
      { discrete: true }
    );
  });
  expect(input).toHaveTextContent("Submitted draft");
  rerender(<Editor locked={false} />);
  expect(input).not.toHaveAttribute("aria-readonly", "true");
  expect(
    fireEvent(
      input,
      new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: "x",
      })
    )
  ).toBe(true);
});

it("allows an accepted draft reset while locked and cleans up the old root", async () => {
  const { unmount } = render(<Editor locked={true} />);
  const input = screen.getByRole("textbox");
  await act(async () => {
    testEditor.update(
      () => {
        $getRoot().clear().append($createParagraphNode());
      },
      { discrete: true, tag: "composer-reset" }
    );
  });
  expect(input.textContent).toBe("");
  unmount();
  expect(
    fireEvent(
      input,
      new InputEvent("beforeinput", { bubbles: true, cancelable: true })
    )
  ).toBe(true);
});

it("restores a non-cancellable native input change while submitting", async () => {
  render(<Editor locked={true} />);
  const input = screen.getByRole("textbox");
  const text = input.querySelector("[data-lexical-text]");
  expect(text).not.toBeNull();
  await act(async () => {
    text!.textContent = "Autocorrected while pending";
    fireEvent.input(input, {
      inputType: "insertReplacementText",
      bubbles: true,
      cancelable: false,
    });
  });
  await waitFor(() => expect(input).toHaveTextContent("Submitted draft"));
});
