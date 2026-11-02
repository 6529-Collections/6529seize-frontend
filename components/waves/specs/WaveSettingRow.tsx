"use client";

import PencilIcon, {
  PencilIconSize,
} from "@/components/utils/icons/PencilIcon";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { isTouchFirstEnvironment } from "@/helpers/touch-first.helpers";
import { FocusTrap } from "focus-trap-react";
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
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { useWaveInformationPanel } from "@/components/brain/mobile/WaveInformationPanelContext";
import { WaveSettingEditorContext } from "./WaveSettingEditorContext";

interface WaveSettingRowProps {
  readonly canEdit: boolean;
  readonly editIcon?: "gear" | "pencil" | undefined;
  readonly editLabel: string;
  readonly label: string;
  readonly onOpen: () => void;
  readonly renderEditor: (controls: {
    readonly closeEditor: () => void;
  }) => ReactNode;
  readonly valueLabel: ReactNode;
  readonly variant?: "content" | "row" | undefined;
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
  editIcon = "pencil",
  editLabel,
  label,
  onOpen,
  renderEditor,
  valueLabel,
  variant = "row",
}: WaveSettingRowProps) {
  const editorId = useId();
  const panel = useWaveInformationPanel(editLabel);
  const { isOpen: isEditorOpen, close: closeEditor, open: openPanel } = panel;
  const [useBottomSheet, setUseBottomSheet] = useState(() =>
    shouldUseBottomSheet()
  );
  const [popoverPosition, setPopoverPosition] = useState<{
    readonly left: number;
    readonly top: number;
  } | null>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEditorOpen || useBottomSheet || panel.isInSheet) {
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
        event.preventDefault();
        event.stopPropagation();
        closeEditor();
      }
    };

    globalThis.document.addEventListener("mousedown", handlePointerDown);
    globalThis.document.addEventListener("touchstart", handlePointerDown, {
      passive: true,
    });
    globalThis.document.addEventListener("keydown", handleKeyDown);

    return () => {
      globalThis.document.removeEventListener("mousedown", handlePointerDown);
      globalThis.document.removeEventListener("touchstart", handlePointerDown);
      globalThis.document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeEditor, isEditorOpen, useBottomSheet, panel.isInSheet]);

  const openEditor = useCallback(() => {
    onOpen();
    setPopoverPosition(null);
    openPanel(editButtonRef.current);
  }, [onOpen, openPanel]);

  const toggleEditor = () => {
    if (isEditorOpen) {
      closeEditor();
      return;
    }

    openEditor();
  };

  const updatePopoverPosition = useCallback(() => {
    if (!isEditorOpen || useBottomSheet || panel.isInSheet) {
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
  }, [isEditorOpen, useBottomSheet, panel.isInSheet]);

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
    if (!isEditorOpen || useBottomSheet || panel.isInSheet) {
      return;
    }

    globalThis.addEventListener("resize", updatePopoverPosition);
    globalThis.addEventListener("scroll", updatePopoverPosition, true);
    const observer = new ResizeObserver(updatePopoverPosition);
    if (editorRef.current) {
      observer.observe(editorRef.current);
    }

    return () => {
      globalThis.removeEventListener("resize", updatePopoverPosition);
      globalThis.removeEventListener("scroll", updatePopoverPosition, true);
      observer.disconnect();
    };
  }, [isEditorOpen, updatePopoverPosition, useBottomSheet, panel.isInSheet]);

  const editorContent = isEditorOpen ? renderEditor({ closeEditor }) : null;
  const editorForm = (
    <WaveSettingEditorContext.Provider
      value={panel.isInSheet || useBottomSheet ? "sheet" : "popover"}
    >
      {editorContent}
    </WaveSettingEditorContext.Provider>
  );
  const bottomSheetSurface = (
    <MobileWrapperDialog
      isOpen={isEditorOpen}
      title={editLabel}
      onClose={closeEditor}
      fitVisualViewport
    >
      <div id={editorId} className="tw-px-4">
        {editorForm}
      </div>
    </MobileWrapperDialog>
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
        role="dialog"
        aria-label={editLabel}
        tabIndex={-1}
        className="tw-max-h-[calc(100dvh-2rem)] tw-w-64 tw-overflow-y-auto tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-3 tw-shadow-xl"
      >
        {editorForm}
      </div>
    </div>
  );
  let editorSurface: ReactNode = null;
  if (isEditorOpen && panel.isInSheet) {
    editorSurface =
      panel.container &&
      createPortal(
        <div className="tw-px-4">{editorForm}</div>,
        panel.container
      );
  } else if (useBottomSheet) {
    editorSurface = bottomSheetSurface;
  } else if (isEditorOpen) {
    editorSurface = createPortal(
      <FocusTrap
        active={popoverPosition !== null}
        focusTrapOptions={{
          escapeDeactivates: false,
          clickOutsideDeactivates: true,
          fallbackFocus: () => editorRef.current!,
          setReturnFocus: () => editButtonRef.current ?? false,
        }}
      >
        {popoverSurface}
      </FocusTrap>,
      globalThis.document.body
    );
  }
  const rowGridClasses = canEdit
    ? "tw-grid-cols-[minmax(5.5rem,0.7fr)_minmax(0,1.3fr)_2.75rem] sm:tw-grid-cols-[minmax(5.5rem,0.7fr)_minmax(0,1.3fr)_1.75rem]"
    : "tw-grid-cols-[minmax(5.5rem,0.7fr)_minmax(0,1.3fr)]";
  const editIconContent =
    editIcon === "gear" ? (
      <Cog6ToothIcon aria-hidden="true" className="tw-size-5" />
    ) : (
      <PencilIcon size={PencilIconSize.SMALL} />
    );
  const editButton = canEdit ? (
    <button
      ref={editButtonRef}
      type="button"
      aria-label={editLabel}
      aria-controls={panel.isInSheet ? panel.contentId : editorId}
      aria-expanded={isEditorOpen}
      aria-haspopup={panel.isInSheet ? undefined : "dialog"}
      title={editLabel}
      onClick={toggleEditor}
      className="tw-flex tw-size-11 tw-shrink-0 tw-items-center tw-justify-center tw-justify-self-end tw-rounded-lg tw-border-none tw-bg-transparent tw-p-0 tw-text-iron-500 tw-transition-all tw-duration-300 tw-ease-out hover:tw-bg-iron-800 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-iron-300 sm:tw-size-7"
    >
      {editIconContent}
    </button>
  ) : null;

  if (variant === "content") {
    return (
      <section className="tw-px-4 tw-py-4">
        <div className="tw-flex tw-min-h-7 tw-items-center tw-justify-between tw-gap-x-4">
          <h2 className="tw-mb-0 !tw-text-[0.6875rem] !tw-font-semibold tw-uppercase !tw-leading-4 tw-tracking-[0.06em] !tw-text-iron-400 sm:tw-tracking-[0.1em]">
            {label}
          </h2>
          {editButton}
        </div>
        <div className="tw-mt-3 tw-min-w-0 tw-break-words tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-pt-3 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-100">
          {valueLabel}
        </div>
        {editorSurface}
      </section>
    );
  }

  return (
    <div
      className={`tw-group tw-grid tw-min-h-9 tw-w-full ${rowGridClasses} tw-items-center tw-gap-x-2 tw-gap-y-1 tw-px-2 tw-py-1.5 tw-text-sm`}
    >
      <span className="tw-min-w-0 tw-py-0.5 tw-font-normal tw-leading-5 tw-text-iron-500">
        {label}
      </span>
      <span className="tw-min-w-0 tw-break-words tw-py-0.5 tw-text-right tw-font-medium tw-leading-5 tw-text-iron-50">
        {valueLabel}
      </span>
      {editButton}

      {editorSurface}
    </div>
  );
}
