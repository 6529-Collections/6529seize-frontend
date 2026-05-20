"use client";

import { useAuth } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import PencilIcon, {
  PencilIconSize,
} from "@/components/utils/icons/PencilIcon";
import type { ApiUpdateWaveRequest } from "@/generated/models/ApiUpdateWaveRequest";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  canEditWave,
  convertWaveToUpdateWave,
} from "@/helpers/waves/waves.helpers";
import { commonApiPost } from "@/services/api/common-api";
import {
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

interface WaveDisableLinksProps {
  readonly wave: ApiWave;
}

const VIEWPORT_PADDING_PX = 16;
const POPOVER_GAP_PX = 8;
const POPOVER_WIDTH_PX = 256;

const shouldUseBottomSheet = () => {
  if (typeof globalThis.matchMedia !== "function") {
    return false;
  }

  return globalThis.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
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

export default function WaveDisableLinks({ wave }: WaveDisableLinksProps) {
  const { connectedProfile, activeProfileProxy, requestAuth, setToast } =
    useAuth();
  const { onWaveCreated } = useContext(ReactQueryWrapperContext);
  const editorId = useId();
  const canEdit = canEditWave({ connectedProfile, activeProfileProxy, wave });
  const linksDisabled = wave.chat.links_disabled === true;
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draftLinksDisabled, setDraftLinksDisabled] = useState(linksDisabled);
  const [mutating, setMutating] = useState(false);
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
    setDraftLinksDisabled(linksDisabled);
    setPopoverPosition(null);
    setIsEditorOpen(true);
  }, [linksDisabled]);

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

  const updateWave = async (body: ApiUpdateWaveRequest): Promise<void> => {
    setMutating(true);

    try {
      const { success } = await requestAuth();
      if (!success) {
        setToast({
          type: "error",
          message: "Failed to authenticate",
        });
        return;
      }

      await commonApiPost<ApiUpdateWaveRequest, ApiWave>({
        endpoint: `waves/${wave.id}`,
        body,
      });
      onWaveCreated();
      closeEditor();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : String(error),
        type: "error",
      });
    } finally {
      setMutating(false);
    }
  };

  const handleSave = () => {
    if (mutating) {
      return;
    }

    const body = convertWaveToUpdateWave(wave);
    void updateWave({
      ...body,
      chat: {
        ...body.chat,
        links_disabled: draftLinksDisabled,
      },
    });
  };

  const editorForm = (
    <form
      className="tw-flex tw-flex-col tw-gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        handleSave();
      }}
    >
      <label className="tw-flex tw-cursor-pointer tw-items-start tw-gap-2 tw-text-sm tw-text-iron-100">
        <input
          type="checkbox"
          aria-label="Disable links"
          autoFocus
          checked={draftLinksDisabled}
          disabled={mutating}
          onChange={(event) => setDraftLinksDisabled(event.target.checked)}
          className="tw-mt-0.5 tw-h-4 tw-w-4 tw-rounded tw-border-iron-600 tw-bg-iron-900 tw-text-primary-500 focus:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
        />
        <span>Disable links</span>
      </label>

      <div className="tw-flex tw-items-center tw-justify-end tw-gap-2">
        <button
          type="button"
          disabled={mutating}
          onClick={closeEditor}
          className="tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-transparent tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-300 tw-transition disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-border-iron-500 desktop-hover:hover:tw-text-iron-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={mutating}
          className="tw-rounded-md tw-border tw-border-solid tw-border-primary-500 tw-bg-primary-500 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-white tw-transition disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-border-primary-600 desktop-hover:hover:tw-bg-primary-600"
        >
          Save
        </button>
      </div>
    </form>
  );

  const bottomSheetSurface = (
    <div className="tailwind-scope tw-fixed tw-inset-0 tw-z-[1200] tw-flex tw-items-end tw-bg-black/60 tw-px-3 tw-pb-3 tw-pt-10">
      <dialog
        open
        aria-modal="true"
        aria-label="Edit disable links"
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

  return (
    <div className="tw-group tw-flex tw-min-h-6 tw-w-full tw-items-center tw-justify-between tw-gap-1.5 tw-text-sm">
      <span className="tw-font-medium tw-text-iron-400">Disable links</span>
      <div className="tw-flex tw-items-center tw-gap-x-2">
        <span className="tw-font-medium tw-text-iron-200">
          {linksDisabled ? "On" : "Off"}
        </span>
        {canEdit && (
          <button
            ref={editButtonRef}
            type="button"
            aria-label="Edit disable links"
            aria-controls={editorId}
            aria-expanded={isEditorOpen}
            aria-haspopup="dialog"
            title="Edit disable links"
            onClick={toggleEditor}
            className="tw-border-none tw-bg-transparent tw-p-0 tw-text-iron-300 tw-transition-all tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-iron-400"
          >
            <PencilIcon size={PencilIconSize.SMALL} />
          </button>
        )}
      </div>

      {editorSurface}
    </div>
  );
}
