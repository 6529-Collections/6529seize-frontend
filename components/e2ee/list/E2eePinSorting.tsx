"use client";

import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type TouchEvent,
} from "react";
import { useAuth } from "@/components/auth/Auth";
import {
  canDragPinnedRowFrom,
  suppressPinnedRowDropClick,
  usePinnedRowSensors,
} from "@/components/brain/left-sidebar/waves/pinnedRowDrag";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useE2eeContext } from "../E2eeContext";

export function E2eePinSorting({
  pins,
  children,
}: {
  readonly pins: string[];
  readonly children: ReactNode;
}) {
  const { engine } = useE2eeContext();
  const { setToast } = useAuth();
  const locale = useBrowserLocale();
  const sensors = usePinnedRowSensors();
  const dragStartPins = useRef<readonly string[]>([]);
  const saving = useRef(false);
  const [saved, setSaved] = useState(false);

  async function movePin(from: string, to: string) {
    if (!engine || saving.current || from === to) return;
    saving.current = true;
    try {
      await engine.moveConversationPin(from, to);
      setSaved(true);
    } catch {
      setToast({
        type: "error",
        message: t(locale, "e2ee.list.pinOrderError"),
      });
    } finally {
      saving.current = false;
    }
  }

  function endDrag(event: DragEndEvent) {
    suppressPinnedRowDropClick(event);
    const { active, over } = event;
    if (
      !over ||
      pins.length !== dragStartPins.current.length ||
      pins.some((pin, index) => pin !== dragStartPins.current[index])
    )
      return;
    void movePin(String(active.id), String(over.id));
  }

  return (
    <DndContext
      sensors={sensors}
      accessibility={{
        screenReaderInstructions: {
          draggable: t(locale, "e2ee.list.pinDragInstructions"),
        },
        announcements: {
          onDragStart: () => t(locale, "e2ee.list.pinDragStarted"),
          onDragOver: ({ over }) => {
            const position = pins.indexOf(String(over?.id)) + 1;
            return position > 0
              ? t(locale, "e2ee.list.pinDragPosition", { position })
              : undefined;
          },
          onDragEnd: () => undefined,
          onDragCancel: () => t(locale, "e2ee.list.pinDragCancelled"),
        },
      }}
      collisionDetection={closestCenter}
      onDragStart={() => {
        dragStartPins.current = pins;
        setSaved(false);
      }}
      onDragEnd={endDrag}
      onDragCancel={suppressPinnedRowDropClick}
    >
      <SortableContext items={pins} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
      <output className="tw-sr-only">
        {saved && t(locale, "e2ee.list.pinOrderSaved")}
      </output>
    </DndContext>
  );
}

export function useSortableChatPin(thread: string, enabled: boolean) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: thread,
    disabled: { draggable: !enabled, droppable: !enabled },
  });

  if (!enabled)
    return { rowProps: undefined, linkProps: undefined, isDragging: false };

  return {
    rowProps: {
      ref: setNodeRef,
      style: { transform: CSS.Translate.toString(transform), transition },
      onMouseDown: (event: MouseEvent<HTMLLIElement>) => {
        if (event.button === 0 && canDragPinnedRowFrom(event.target)) {
          listeners?.["onMouseDown"]?.(event);
        }
      },
      onTouchStart: (event: TouchEvent<HTMLLIElement>) => {
        if (canDragPinnedRowFrom(event.target))
          listeners?.["onTouchStart"]?.(event);
      },
    },
    linkProps: {
      ref: setActivatorNodeRef,
      draggable: false,
      onKeyDown: (event: KeyboardEvent<HTMLAnchorElement>) => {
        listeners?.["onKeyDown"]?.(event);
      },
      "aria-describedby": attributes["aria-describedby"],
      "aria-keyshortcuts": "Space",
    },
    isDragging,
  };
}
