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
import Button from "@/components/utils/button/Button";
import type { CurationOrder } from "@/hooks/useCurationOrder";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { formatInteger } from "@/i18n/format";
import type { CurationDropPlacement } from "@/services/api/curation-drop-order-api";

type Target = { id: string; placement: CurationDropPlacement };
type OrderDrop = CurationOrder["drops"][number];
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

function getKeyboardTarget({
  drops,
  selectedId,
  target,
  direction,
}: {
  readonly drops: readonly OrderDrop[];
  readonly selectedId: string;
  readonly target: Target | null;
  readonly direction: -1 | 1;
}): Target | null {
  const selectedIndex = drops.findIndex((drop) => drop.id === selectedId);
  if (selectedIndex < 0) return null;
  const remaining = drops.filter((drop) => drop.id !== selectedId);
  let currentIndex = selectedIndex;
  if (target) {
    const anchorIndex = remaining.findIndex((drop) => drop.id === target.id);
    if (anchorIndex >= 0) {
      currentIndex = anchorIndex + (target.placement === "after" ? 1 : 0);
    }
  }
  const nextIndex = Math.max(
    0,
    Math.min(remaining.length, currentIndex + direction)
  );
  if (nextIndex === currentIndex) return target;
  if (nextIndex === 0) {
    const first = remaining[0];
    return first ? { id: first.id, placement: "before" } : null;
  }
  const previous = remaining[nextIndex - 1];
  return previous ? { id: previous.id, placement: "after" } : null;
}

type OrganizeContextValue = {
  enabled: boolean;
  busy: boolean;
  selectedId: string | null;
  target: Target | null;
  instructionsId: string;
  axis: "horizontal" | "vertical";
  select: (id: string) => void;
  keyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
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
  const targetRef = useRef<Target | null>(null);
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
  const hasSessionFeedback = active && order.revealRequest !== feedbackBaseline;
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
    targetRef.current = null;
    order.release();
  };
  if (!active && (selectedId || target || draggingId)) {
    setSelectedId(null);
    setTarget(null);
    setDraggingId(null);
  }
  const release = order.release;
  useEffect(() => {
    if (!active) {
      targetRef.current = null;
      release();
    }
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
  const keyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      cancel();
      setAnnouncement(t(locale, "profileCuration.order.cancelled"));
      return;
    }
    if (selectedId && (event.key === " " || event.key === "Enter")) {
      event.preventDefault();
      if (target) place(selectedId, target);
      else cancel();
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
    const destination = getKeyboardTarget({
      drops: order.drops,
      selectedId,
      target,
      direction,
    });
    if (!destination || destination === target) return;
    targetRef.current = destination;
    setTarget(destination);
    order.revealDrop(destination.id);
    const preview = order.drops.filter((drop) => drop.id !== selectedId);
    const anchorIndex = preview.findIndex((drop) => drop.id === destination.id);
    const index = anchorIndex + (destination.placement === "after" ? 1 : 0);
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
      targetRef.current = null;
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
    const nextTarget = { id: String(over.id), placement } as const;
    if (
      targetRef.current?.id === nextTarget.id &&
      targetRef.current.placement === nextTarget.placement
    )
      return;
    targetRef.current = nextTarget;
    setTarget(nextTarget);
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
        onDragEnd={({ active: item }) => {
          const destination = targetRef.current;
          if (destination) place(String(item.id), destination);
          else cancel();
        }}
      >
        {active && (
          <div className="tailwind-scope tw-sticky tw-top-0 tw-z-[1001] tw-mb-3 tw-min-h-[52px] tw-w-full tw-border-x-0 tw-border-y tw-border-solid tw-border-white/10 tw-bg-black/85 tw-backdrop-blur-md">
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
              <Button
                ref={doneButton}
                variant="secondary"
                size="sm"
                disabled={order.busy}
                onClick={() => {
                  cancel();
                  onDone();
                }}
                className="disabled:tw-cursor-wait"
              >
                {t(locale, "profileCuration.order.done")}
              </Button>
            </div>
            <p id={instructionsId} className="tw-sr-only">
              {guidance}
            </p>
            <span id={`${instructionsId}-keyboard`} className="tw-sr-only">
              {t(locale, "profileCuration.order.keyboardHelp")}
            </span>
            <div role="status" aria-live="polite" className="tw-sr-only">
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
            <div
              aria-hidden="true"
              className="tailwind-scope tw-flex tw-h-7 tw-w-8 tw-items-center tw-justify-center tw-rounded-[7px] tw-bg-black/70 tw-text-iron-100 tw-shadow-[0_4px_14px_rgba(0,0,0,0.36)] tw-backdrop-blur-sm"
            >
              <svg
                aria-hidden="true"
                width="22"
                height="16"
                viewBox="0 0 22 16"
                fill="none"
              >
                <path
                  d="M3 5h16M3 11h16"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </OrganizeContext.Provider>
  );
}
