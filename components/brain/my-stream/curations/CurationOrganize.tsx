"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  closestCenter,
  useSensor,
  useSensors,
  type DragMoveEvent,
  type Modifier,
} from "@dnd-kit/core";
import { getEventCoordinates } from "@dnd-kit/utilities";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import type { CurationOrder } from "@/hooks/useCurationOrder";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { formatInteger } from "@/i18n/format";
import type { CurationDropPlacement } from "@/services/api/curation-drop-order-api";

type Target = { id: string; placement: CurationDropPlacement };
const DRAG_OVERLAY_MARGIN = 8;
const restrictDragOverlayToViewport: Modifier = ({
  overlayNodeRect,
  transform,
  windowRect,
}) => {
  if (!overlayNodeRect || !windowRect) return transform;
  let x = transform.x;
  let y = transform.y;
  const left = overlayNodeRect.left + x;
  const right = overlayNodeRect.right + x;
  const top = overlayNodeRect.top + y;
  const bottom = overlayNodeRect.bottom + y;
  if (left < windowRect.left + DRAG_OVERLAY_MARGIN)
    x += windowRect.left + DRAG_OVERLAY_MARGIN - left;
  else if (right > windowRect.right - DRAG_OVERLAY_MARGIN)
    x -= right - (windowRect.right - DRAG_OVERLAY_MARGIN);
  if (top < windowRect.top + DRAG_OVERLAY_MARGIN)
    y += windowRect.top + DRAG_OVERLAY_MARGIN - top;
  else if (bottom > windowRect.bottom - DRAG_OVERLAY_MARGIN)
    y -= bottom - (windowRect.bottom - DRAG_OVERLAY_MARGIN);
  return { ...transform, x, y };
};
const dragOverlayModifiers = [restrictDragOverlayToViewport];

type OrganizeContextValue = {
  enabled: boolean;
  busy: boolean;
  selectedId: string | null;
  target: Target | null;
  instructionsId: string;
  axis: "horizontal" | "vertical";
  select: (id: string) => void;
  keyDown: (id: string, event: KeyboardEvent<HTMLButtonElement>) => void;
};
const OrganizeContext = createContext<OrganizeContextValue | null>(null);

export function useCurationOrganize() {
  const context = useContext(OrganizeContext);
  if (!context) throw new Error("Curation cards require an Organize provider");
  return context;
}

export default function CurationOrganize({
  order,
  enabled,
  onDone,
  children,
  axis = "vertical",
}: {
  readonly order: CurationOrder;
  readonly enabled: boolean;
  readonly onDone: () => void;
  readonly children: ReactNode;
  readonly axis?: "horizontal" | "vertical";
}) {
  const locale = useBrowserLocale();
  const instructionsId = useId();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const active = enabled && order.canAuthenticate;
  const [feedbackSession, setFeedbackSession] = useState({
    active,
    revealRequest: order.revealRequest,
  });
  let feedbackBaseline = feedbackSession.revealRequest;
  if (active !== feedbackSession.active) {
    feedbackBaseline = order.revealRequest;
    setFeedbackSession({ active, revealRequest: order.revealRequest });
  }
  const hasSessionFeedback =
    active && order.revealRequest !== feedbackBaseline;
  const doneButton = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (active) doneButton.current?.focus();
  }, [active]);
  const movedPostMissing =
    !!order.revealRequest &&
    !order.busy &&
    !order.drops.some((drop) => drop.id === order.revealRequest?.id);
  useEffect(() => {
    if (active && movedPostMissing) doneButton.current?.focus();
  }, [active, movedPostMissing]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );
  const indices = useMemo(
    () => new Map(order.drops.map((drop, index) => [drop.id, index])),
    [order.drops]
  );
  const postName = (id: string) =>
    t(locale, "profileCuration.order.postNumber", {
      number: formatInteger(
        locale,
        order.startIndex + (indices.get(id) ?? 0) + 1
      ),
    });

  const cancel = () => {
    setSelectedId(null);
    setDraggingId(null);
    setTarget(null);
    order.release();
  };
  if (!active && (selectedId || target || draggingId)) {
    setSelectedId(null);
    setTarget(null);
    setDraggingId(null);
  }
  const release = order.release;
  useEffect(() => {
    if (!active) release();
  }, [active, release]);
  let status =
    hasSessionFeedback && order.saved
      ? t(locale, "profileCuration.order.saved")
      : null;
  if (order.isSaving) status = t(locale, "profileCuration.order.saving");
  const guidance = t(
    locale,
    selectedId
      ? "profileCuration.order.chooseDestination"
      : "profileCuration.order.help"
  );
  const toolbarMessage = selectedId ? guidance : (status ?? guidance);
  const showToolbarMessageOnMobile = !!status && !selectedId;

  const place = (id: string, destination: Target) => {
    cancel();
    void order.move(id, {
      anchorDropId: destination.id,
      placement: destination.placement,
    });
  };
  const select = (id: string) => {
    if (!active || order.busy) return;
    if (!selectedId) {
      order.hold();
      setSelectedId(id);
      setAnnouncement(
        t(locale, "profileCuration.order.pickedUp", { postName: postName(id) })
      );
    } else if (selectedId === id) cancel();
    else
      place(selectedId, {
        id,
        placement:
          (indices.get(id) ?? 0) < (indices.get(selectedId) ?? 0)
            ? "before"
            : "after",
      });
  };
  const keyDown = (id: string, event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      cancel();
      setAnnouncement(t(locale, "profileCuration.order.cancelled"));
      return;
    }
    if (
      !selectedId ||
      !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
    )
      return;
    event.preventDefault();
    const direction =
      event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 1;
    const index = Math.max(
      0,
      Math.min(order.drops.length - 1, (indices.get(id) ?? 0) + direction)
    );
    const destination = order.drops[index];
    if (!destination) return;
    setTarget({
      id: destination.id,
      placement: index < (indices.get(selectedId) ?? 0) ? "before" : "after",
    });
    order.revealDrop(destination.id);
    setAnnouncement(
      t(locale, "profileCuration.order.previewPosition", {
        postName: postName(selectedId),
        position: formatInteger(locale, order.startIndex + index + 1),
      })
    );
  };
  const updateTarget = ({
    over,
    active: dragged,
    delta,
    activatorEvent,
  }: DragMoveEvent) => {
    if (!over || over.id === dragged.id) {
      setTarget(null);
      return;
    }
    const start = getEventCoordinates(activatorEvent);
    if (!start) return;
    const before =
      axis === "horizontal"
        ? start.x + delta.x < over.rect.left + over.rect.width / 2
        : start.y + delta.y < over.rect.top + over.rect.height / 2;
    const placement = before ? "before" : "after";
    setTarget((current) =>
      current?.id === over.id && current.placement === placement
        ? current
        : { id: String(over.id), placement }
    );
  };

  return (
    <OrganizeContext.Provider
      value={{
        enabled: active,
        busy: order.busy,
        selectedId,
        target,
        instructionsId,
        axis,
        select,
        keyDown,
      }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={(args) => {
          const hits = pointerWithin(args);
          return hits.length ? hits : closestCenter(args);
        }}
        accessibility={{
          screenReaderInstructions: {
            draggable: t(locale, "profileCuration.order.keyboardHelp"),
          },
          announcements: {
            onDragStart: ({ active: item }) =>
              t(locale, "profileCuration.order.pickedUp", {
                postName: postName(String(item.id)),
              }),
            onDragOver: () => undefined,
            onDragEnd: () => undefined,
            onDragCancel: () => t(locale, "profileCuration.order.cancelled"),
          },
        }}
        onDragStart={({ active: item }) => {
          order.hold();
          setSelectedId(String(item.id));
          setDraggingId(String(item.id));
        }}
        onDragMove={updateTarget}
        onDragOver={updateTarget}
        onDragCancel={cancel}
        onDragEnd={() => {
          if (draggingId && target) place(draggingId, target);
          else cancel();
        }}
      >
        {active && (
          <div className="tailwind-scope tw-sticky tw-top-0 tw-z-[1001] tw-min-h-[52px] tw-w-full tw-border-x-0 tw-border-y tw-border-solid tw-border-white/10 tw-bg-black/85 tw-px-4 tw-backdrop-blur-md">
            <div className="tw-flex tw-h-[50px] tw-items-center tw-gap-2">
              <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-baseline">
                <span className="tw-flex-shrink-0 tw-text-sm tw-font-semibold tw-text-iron-100">
                  {t(locale, "profileCuration.order.organizing")}
                </span>
                <span
                  className={`tw-ml-2 tw-min-w-0 tw-truncate tw-text-xs tw-text-iron-500 ${showToolbarMessageOnMobile ? "tw-inline" : "tw-hidden sm:tw-inline"}`}
                >
                  {toolbarMessage}
                </span>
              </div>
              <button
                ref={doneButton}
                type="button"
                disabled={order.busy}
                onClick={() => {
                  cancel();
                  onDone();
                }}
                className="tw-h-11 tw-border-0 tw-bg-transparent tw-px-2 tw-text-sm tw-font-semibold tw-text-iron-100 tw-outline-none desktop-hover:hover:tw-text-white focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 disabled:tw-cursor-wait disabled:tw-opacity-50"
              >
                {t(locale, "profileCuration.order.done")}
              </button>
            </div>
            <p id={instructionsId} className="tw-sr-only">
              {guidance}
            </p>
            <span id={`${instructionsId}-keyboard`} className="tw-sr-only">
              {t(locale, "profileCuration.order.keyboardHelp")}
            </span>
            <div
              role="status"
              aria-live="polite"
              className="tw-sr-only"
            >
              {status}
              <span className="tw-sr-only">{announcement}</span>
            </div>
            {hasSessionFeedback && order.error && (
              <p
                role="alert"
                className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-red"
              >
                {order.error}
              </p>
            )}
          </div>
        )}
        {children}
        <DragOverlay modifiers={dragOverlayModifiers} dropAnimation={null}>
          {draggingId && (
            <div className="tailwind-scope tw-w-48 tw-rounded-xl tw-border tw-border-solid tw-border-primary-400 tw-bg-iron-900 tw-p-4 tw-text-sm tw-font-semibold tw-text-iron-50 tw-shadow-xl">
              {postName(draggingId)}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </OrganizeContext.Provider>
  );
}
