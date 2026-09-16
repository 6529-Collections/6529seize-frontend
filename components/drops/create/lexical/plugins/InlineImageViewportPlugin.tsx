"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { useLayoutEffect } from "react";
import { useNativeKeyboard } from "@/hooks/useNativeKeyboard";

function getCaretRect(root: HTMLElement): DOMRect | null {
  if (root.ownerDocument.activeElement !== root) return null;
  const selection = root.ownerDocument.getSelection();
  if (
    !selection?.isCollapsed ||
    !selection.rangeCount ||
    !root.contains(selection.focusNode)
  )
    return null;
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  if (rect.height > 0) return rect;
  // Empty paragraphs have a visible line but their collapsed range can be 0x0.
  const node = selection.focusNode;
  const element = node instanceof Element ? node : node?.parentElement;
  return element && element !== root ? element.getBoundingClientRect() : null;
}

function getVisibleBounds(root: HTMLElement) {
  const rect = root.getBoundingClientRect();
  const viewport = globalThis.visualViewport;
  const top = Math.max(rect.top, viewport?.offsetTop ?? 0);
  const bottom = Math.min(
    rect.bottom,
    (viewport?.offsetTop ?? 0) + (viewport?.height ?? globalThis.innerHeight)
  );
  return { top, bottom };
}

export default function InlineImageViewportPlugin(): null {
  const [editor] = useLexicalComposerContext();
  const { keyboardHeight } = useNativeKeyboard();

  useLayoutEffect(() => {
    let root: HTMLElement | null = null;
    let frame: number | undefined;
    let followCaret = true;
    let removeRootListeners = () => {};

    const cancelFrame = () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = undefined;
    };

    const keepCaretVisible = () => {
      frame = undefined;
      if (!root || editor.isComposing()) return;
      const caret = getCaretRect(root);
      if (!caret) return;
      const bounds = getVisibleBounds(root);
      if (bounds.bottom <= bounds.top) return;
      const lineHeight =
        Number.parseFloat(getComputedStyle(root).lineHeight) || 24;
      const margin = Math.min(lineHeight, (bounds.bottom - bounds.top) / 4);
      if (caret.bottom > bounds.bottom - margin) {
        root.scrollTop += caret.bottom - bounds.bottom + margin;
      } else if (caret.top < bounds.top + margin) {
        root.scrollTop += caret.top - bounds.top - margin;
      }
    };

    const schedule = () => {
      if (!followCaret) return;
      cancelFrame();
      frame = requestAnimationFrame(keepCaretVisible);
    };

    const resize = () => {
      if (!root) return;
      const styles = getComputedStyle(root);
      const inset =
        Number.parseFloat(
          styles.getPropertyValue("--native-keyboard-inset-bottom")
        ) || 0;
      const viewportHeight = Math.min(
        globalThis.visualViewport?.height ?? globalThis.innerHeight,
        globalThis.innerHeight - inset
      );
      root.style.setProperty(
        "--composer-viewport-height",
        `${Math.max(0, viewportHeight * 0.4)}px`
      );
      const maxHeight = Number.parseFloat(getComputedStyle(root).maxHeight);
      const imageHeight = Math.min(
        160,
        viewportHeight * 0.16,
        Number.isFinite(maxHeight) ? maxHeight * 0.45 : 160
      );
      root.style.setProperty(
        "--composer-image-height",
        `${Math.max(32, Math.floor(imageHeight))}px`
      );
      schedule();
    };

    const onScroll = () => {
      if (!root) return;
      const caret = getCaretRect(root);
      const bounds = getVisibleBounds(root);
      if (!caret || caret.top < bounds.top || caret.bottom > bounds.bottom)
        followCaret = false;
    };
    const onUserScroll = () => {
      followCaret = false;
      cancelFrame();
    };
    const onInput = () => {
      followCaret = true;
      schedule();
    };

    const unregister = mergeRegister(
      editor.registerRootListener((nextRoot) => {
        removeRootListeners();
        root = nextRoot;
        if (!nextRoot) return;
        nextRoot.addEventListener("scroll", onScroll, { passive: true });
        nextRoot.addEventListener("wheel", onUserScroll, { passive: true });
        nextRoot.addEventListener("touchstart", onUserScroll, {
          passive: true,
        });
        nextRoot.addEventListener("input", onInput);
        nextRoot.addEventListener("keydown", onInput);
        nextRoot.addEventListener("click", onInput);
        const observer = new ResizeObserver(resize);
        observer.observe(nextRoot);
        resize();
        removeRootListeners = () => {
          observer.disconnect();
          nextRoot.removeEventListener("scroll", onScroll);
          nextRoot.removeEventListener("wheel", onUserScroll);
          nextRoot.removeEventListener("touchstart", onUserScroll);
          nextRoot.removeEventListener("input", onInput);
          nextRoot.removeEventListener("keydown", onInput);
          nextRoot.removeEventListener("click", onInput);
          nextRoot.style.removeProperty("--composer-image-height");
          nextRoot.style.removeProperty("--composer-viewport-height");
        };
      }),
      editor.registerUpdateListener(({ tags }) => {
        if (tags.has("composer-image-insert") || tags.has("historic"))
          followCaret = true;
        schedule();
      })
    );
    globalThis.visualViewport?.addEventListener("resize", resize);
    globalThis.addEventListener("resize", resize);
    return () => {
      unregister();
      removeRootListeners();
      cancelFrame();
      globalThis.visualViewport?.removeEventListener("resize", resize);
      globalThis.removeEventListener("resize", resize);
    };
  }, [editor, keyboardHeight]);

  return null;
}
