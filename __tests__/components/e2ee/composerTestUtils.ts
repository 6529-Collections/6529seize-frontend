import { act } from "@testing-library/react";
import { $convertToMarkdownString } from "@lexical/markdown";
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  getNearestEditorFromDOMNode,
} from "lexical";
import { E2EE_COMPOSER_TRANSFORMERS } from "@/components/e2ee/conversation/e2eeComposerTransformers";

export function setComposerText(input: HTMLElement, text: string) {
  const editor = getNearestEditorFromDOMNode(input);
  if (!editor) throw new Error("Composer editor is not mounted");
  act(() =>
    editor.update(
      () => {
        $getRoot()
          .clear()
          .append($createParagraphNode().append($createTextNode(text)));
        $getRoot().selectEnd();
      },
      { discrete: true }
    )
  );
}

export function composerText(input: HTMLElement): string {
  const editor = getNearestEditorFromDOMNode(input);
  if (!editor) throw new Error("Composer editor is not mounted");
  act(() => editor.update(() => {}, { discrete: true }));
  return editor
    .getEditorState()
    .read(() => $convertToMarkdownString(E2EE_COMPOSER_TRANSFORMERS));
}

export function selectComposerText(
  input: HTMLElement,
  start: number,
  end = start
) {
  const editor = getNearestEditorFromDOMNode(input);
  if (!editor) throw new Error("Composer editor is not mounted");
  act(() =>
    editor.update(
      () => {
        $getRoot().getAllTextNodes()[0]?.select(start, end);
      },
      { discrete: true }
    )
  );
}

export function typeAtComposerSelection(input: HTMLElement, text: string) {
  const editor = getNearestEditorFromDOMNode(input);
  if (!editor) throw new Error("Composer editor is not mounted");
  act(() =>
    editor.update(
      () => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection))
          throw new Error("Composer has no text selection");
        selection.insertText(text);
      },
      { discrete: true }
    )
  );
}

const rangeRect = Object.getOwnPropertyDescriptor(
  Range.prototype,
  "getBoundingClientRect"
);
beforeAll(() =>
  Object.defineProperty(Range.prototype, "getBoundingClientRect", {
    configurable: true,
    value: () => new DOMRect(),
  })
);
afterAll(() => {
  if (rangeRect)
    Object.defineProperty(Range.prototype, "getBoundingClientRect", rangeRect);
  else Reflect.deleteProperty(Range.prototype, "getBoundingClientRect");
});
