"use client";

import PencilIcon, {
  PencilIconSize,
} from "@/components/utils/icons/PencilIcon";
import { isTouchFirstEnvironment } from "@/helpers/touch-first.helpers";
import type { ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

interface WaveSettingRowProps {
  readonly canEdit: boolean;
  readonly editLabel: string;
  readonly label: string;
  readonly onOpen: () => void;
  readonly renderEditor: (controls: {
    readonly closeEditor: () => void;
  }) => ReactNode;
  readonly valueLabel: ReactNode;
}

const VIEWPORT_PADDING_PX = 16;
const POPOVER_GAP_PX = 8;
const POPOVER_WIDTH_PX = 256;

const shouldUseBottomSheet = () => {
  if (typeof globalThis.matchMedia !== "function") {
    return false;
  }

  // Small viewports or touch-first devices get the sheet; hybrid touch
  // laptops (fine pointer/hover available) keep the desktop popover.
  return (
    globalThis.matchMedia("(max-width: 767px)").matches ||
    isTouchFirstEnvironment()
  );
};

const isInsideElement = (
  element: HTMLElement | null,
  target: EventTarget | null
) => {
  if (!element || typeof globalThis.Node === "undefined") {
    return false;
  }

  return target instanceof globalThis.Node && element.contains(target);
};

export default function WaveSettingRow({
  canEdit,
  editLabel,
  label,
  onOpen,
  renderEditor,
  valueLabel,
}: WaveSettingRowProps) {
  const editorId = useId();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [useBottomSheet, setUseBottomSheet] = useState(() =>
    shouldUseBottomSheet()
  );
  const [popoverPosition, setPopoverPosition] = useState<{
    readonly left: number;
    readonly top: number;
  } | null>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const closeEditor = useCallback(() => {
    setIsEditorOpen(false);
  }, []);

  useEffect(() => {
    if (!isEditorOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        isInsideElement(editorRef.current, event.target) ||
        isInsideElement(editButtonRef.current, event.target)
      ) {
        return;
      }

      closeEditor();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeEditor();
      }
    };

    globalThis.document.addEventListener("mousedown", handlePointerDown);
    globalThis.document.addEventListener("touchstart", handlePointerDown);
    globalThis.document.addEventListener("keydown", handleKeyDown);

    return () => {
      globalThis.document.removeEventListener("mousedown", handlePointerDown);
      globalThis.document.removeEventListener("touchstart", handlePointerDown);
      globalThis.document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeEditor, isEditorOpen]);

  const openEditor = useCallback(() => {
    onOpen();
    setPopoverPosition(null);
    setIsEditorOpen(true);
  }, [onOpen]);

  const toggleEditor = () => {
    if (isEditorOpen) {
      closeEditor();
      return;
    }

    openEditor();
  };

  const updatePopoverPosition = useCallback(() => {
    if (!isEditorOpen || useBottomSheet) {
      return;
    }

    const button = editButtonRef.current;
    const editor = editorRef.current;
    if (!button || !editor) {
      return;
    }

    const buttonRect = button.getBoundingClientRect();
    const editorWidth = editor.offsetWidth || POPOVER_WIDTH_PX;
    const editorHeight = editor.offsetHeight;
    const viewportWidth =
      globalThis.innerWidth ||
      globalThis.document.documentElement.clientWidth ||
      POPOVER_WIDTH_PX + VIEWPORT_PADDING_PX * 2;
    const viewportHeight =
      globalThis.innerHeight ||
      globalThis.document.documentElement.clientHeight ||
      editorHeight + VIEWPORT_PADDING_PX * 2;

    const maxLeft = Math.max(
      VIEWPORT_PADDING_PX,
      viewportWidth - VIEWPORT_PADDING_PX - editorWidth
    );
    const left = Math.min(
      Math.max(buttonRect.right - editorWidth, VIEWPORT_PADDING_PX),
      maxLeft
    );

    const availableAbove = buttonRect.top - VIEWPORT_PADDING_PX;
    const availableBelow =
      viewportHeight - buttonRect.bottom - VIEWPORT_PADDING_PX;
    const shouldOpenAbove =
      editorHeight > 0 &&
      availableBelow < editorHeight + POPOVER_GAP_PX &&
      availableAbove > availableBelow;
    const unclampedTop = shouldOpenAbove
      ? buttonRect.top - editorHeight - POPOVER_GAP_PX
      : buttonRect.bottom + POPOVER_GAP_PX;
    const maxTop = Math.max(
      VIEWPORT_PADDING_PX,
      viewportHeight - VIEWPORT_PADDING_PX - editorHeight
    );
    const top = Math.min(Math.max(unclampedTop, VIEWPORT_PADDING_PX), maxTop);

    setPopoverPosition({ left, top });
  }, [isEditorOpen, useBottomSheet]);

  useEffect(() => {
    const updateSurfaceMode = () => {
      setUseBottomSheet(shouldUseBottomSheet());
    };

    globalThis.addEventListener("resize", updateSurfaceMode);

    return () => {
      globalThis.removeEventListener("resize", updateSurfaceMode);
    };
  }, []);

  useLayoutEffect(() => {
    updatePopoverPosition();
  }, [updatePopoverPosition]);

  useEffect(() => {
    if (!isEditorOpen || useBottomSheet) {
      return;
    }

    globalThis.addEventListener("resize", updatePopoverPosition);
    globalThis.addEventListener("scroll", updatePopoverPosition, true);

    return () => {
      globalThis.removeEventListener("resize", updatePopoverPosition);
      globalThis.removeEventListener("scroll", updatePopoverPosition, true);
    };
  }, [isEditorOpen, updatePopoverPosition, useBottomSheet]);

  const editorForm = isEditorOpen ? renderEditor({ closeEditor }) : null;
  const bottomSheetSurface = (
    <div className="tailwind-scope tw-fixed tw-inset-0 tw-z-[1200] tw-flex tw-items-end tw-bg-black/60 tw-px-3 tw-pb-3 tw-pt-10">
      <dialog
        open
        aria-modal="true"
        aria-label={editLabel}
        className="tw-relative tw-m-0 tw-w-full tw-max-w-none tw-border-0 tw-bg-transparent tw-p-0 tw-text-inherit"
      >
        <div
          id={editorId}
          ref={editorRef}
          className="tw-w-full tw-rounded-t-xl tw-border tw-border-b-0 tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-4 tw-shadow-[0_-18px_50px_rgba(0,0,0,0.45)]"
        >
          {editorForm}
        </div>
      </dialog>
    </div>
  );
  const popoverSurface = (
    <div
      className="tailwind-scope tw-fixed tw-z-[1200]"
      style={{
        left: popoverPosition?.left ?? 0,
        top: popoverPosition?.top ?? 0,
        visibility: popoverPosition ? "visible" : "hidden",
        width: POPOVER_WIDTH_PX,
      }}
    >
      <div
        id={editorId}
        ref={editorRef}
        className="tw-w-64 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-3 tw-shadow-xl"
      >
        {editorForm}
      </div>
    </div>
  );
  const selectedEditorSurface = useBottomSheet
    ? bottomSheetSurface
    : popoverSurface;
  const editorSurface = isEditorOpen
    ? createPortal(selectedEditorSurface, globalThis.document.body)
    : null;
  const rowGridClasses = canEdit
    ? "tw-grid-cols-[minmax(6.5rem,0.85fr)_minmax(0,1fr)_1.5rem]"
    : "tw-grid-cols-[minmax(6.5rem,0.85fr)_minmax(0,1fr)]";

  return (
    <div
      className={`tw-group tw-grid tw-min-h-8 tw-w-full ${rowGridClasses} tw-items-center tw-gap-x-2 tw-gap-y-1 tw-px-2 tw-py-1 tw-text-sm`}
    >
      <span className="tw-min-w-0 tw-font-normal tw-text-iron-500">
        {label}
      </span>
      <span className="tw-min-w-0 tw-break-words tw-text-right tw-font-medium tw-text-iron-50">
        {valueLabel}
      </span>
      {canEdit && (
        <button
          ref={editButtonRef}
          type="button"
          aria-label={editLabel}
          aria-controls={editorId}
          aria-expanded={isEditorOpen}
          aria-haspopup="dialog"
          title={editLabel}
          onClick={toggleEditor}
          className="tw-flex tw-h-6 tw-w-6 tw-shrink-0 tw-items-center tw-justify-center tw-justify-self-end tw-rounded-lg tw-border-none tw-bg-transparent tw-p-0 tw-text-iron-500 tw-transition-all tw-duration-300 tw-ease-out hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-300"
        >
          <PencilIcon size={PencilIconSize.SMALL} />
        </button>
      )}

      {editorSurface}
    </div>
  );
}
