"use client";

import {
  DndContext,
  KeyboardCode,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragCancelEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
  type TouchEvent,
} from "react";
import type { AnimatedSidebarWaveTreeRow } from "@/hooks/useAnimatedSidebarWaveRows";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { PinnedWaveLinkContext } from "./PinnedWaveLinkContext";
import { SidebarWaveTreeRowTransition } from "./SidebarWaveTreeRowTransition";

interface PinnedWaveGroup {
  readonly id: string;
  readonly parent: AnimatedSidebarWaveTreeRow;
  readonly children: AnimatedSidebarWaveTreeRow[];
}

interface SidebarPinnedWavesProps {
  readonly listRef: RefObject<HTMLDivElement | null>;
  readonly rows: readonly AnimatedSidebarWaveTreeRow[];
  readonly getRowHeight: (row: AnimatedSidebarWaveTreeRow) => number;
  readonly renderRow: (row: AnimatedSidebarWaveTreeRow) => ReactNode;
}

function groupPinnedRows(
  rows: readonly AnimatedSidebarWaveTreeRow[]
): PinnedWaveGroup[] {
  const groups: PinnedWaveGroup[] = [];
  for (const row of rows) {
    if (row.depth === 0 && row.rowType === "wave") {
      groups.push({
        id: row.wave.id,
        parent: row,
        children: [],
      });
    } else {
      groups.at(-1)?.children.push(row);
    }
  }
  return groups;
}

function canDragFrom(target: EventTarget) {
  return (
    target instanceof Element &&
    !target.closest("button, input, select, textarea, [role='button']")
  );
}

function suppressDropClick({ activatorEvent }: DragEndEvent | DragCancelEvent) {
  if (activatorEvent instanceof KeyboardEvent) return;

  // dnd-kit stops the release click from bubbling, but the link still has a
  // browser default action. Cancel it until the next pointer gesture.
  const controller = new AbortController();
  const options = { capture: true, signal: controller.signal };
  const clear = () => controller.abort();
  document.addEventListener(
    "click",
    (event) => {
      if (event.detail > 0) {
        event.preventDefault();
        clear();
      }
    },
    options
  );
  document.addEventListener("pointerdown", clear, options);
  globalThis.setTimeout(clear, 100);
}

function SortablePinnedWave({
  group,
  controls,
  renderRow,
}: {
  readonly group: PinnedWaveGroup;
  readonly controls: boolean;
  readonly renderRow: (row: AnimatedSidebarWaveTreeRow) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id, disabled: !controls });
  const { parent, children } = group;

  function onMouseDown(event: MouseEvent<HTMLDivElement>) {
    if (event.button === 0 && canDragFrom(event.target)) {
      listeners?.["onMouseDown"]?.(event);
    }
  }

  function onTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (canDragFrom(event.target)) {
      listeners?.["onTouchStart"]?.(event);
    }
  }

  const descriptionId = attributes["aria-describedby"];
  const linkProps = useMemo(
    () =>
      listeners && {
        ref: setActivatorNodeRef,
        "aria-describedby": descriptionId,
        "aria-keyshortcuts": "Space",
        onKeyDown: (event: ReactKeyboardEvent<HTMLAnchorElement>) => {
          listeners["onKeyDown"]?.(event);
        },
      },
    [descriptionId, listeners, setActivatorNodeRef]
  );

  return (
    <div
      ref={setNodeRef}
      className={`motion-reduce:tw-!transition-none tw-min-w-0 ${
        isDragging ? "tw-relative tw-z-20 tw-bg-iron-950" : ""
      }`}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
    >
      <div
        className={
          controls
            ? "tw-select-none [-webkit-touch-callout:none] [&_a]:tw-cursor-grab"
            : undefined
        }
        onMouseDown={controls ? onMouseDown : undefined}
        onTouchStart={controls ? onTouchStart : undefined}
      >
        <PinnedWaveLinkContext.Provider value={linkProps}>
          {renderRow(parent)}
        </PinnedWaveLinkContext.Provider>
      </div>
      {children.map(renderRow)}
    </div>
  );
}

function SidebarPinnedWaves({
  listRef,
  rows,
  getRowHeight,
  renderRow,
}: SidebarPinnedWavesProps) {
  // Both sidebar layouts mount this list inside MyStreamProvider.
  const { waves: streamWaves } = useMyStream();
  const {
    reorderPinnedWaves: onReorder,
    isSavingPinnedWaveOrder: isSaving,
    hasPinnedWavesError: hasLoadingError,
    retryPinnedWaves: onRetry,
  } = streamWaves;
  const locale = useBrowserLocale();
  const groups = groupPinnedRows(rows);
  const ids = groups.map((group) => group.id);
  const dragStartIds = useRef<readonly string[]>([]);
  const saving = useRef(false);
  const [status, setStatus] = useState<"saved" | "error" | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: {
        start: [KeyboardCode.Space],
        end: [KeyboardCode.Space, KeyboardCode.Enter, KeyboardCode.Tab],
        cancel: [KeyboardCode.Esc],
      },
    })
  );

  async function move(from: number, to: number) {
    if (
      !onReorder ||
      isSaving ||
      saving.current ||
      from < 0 ||
      from >= ids.length ||
      to < 0 ||
      from === to ||
      to >= ids.length
    )
      return;
    saving.current = true;
    setStatus(null);
    try {
      await onReorder(ids, arrayMove(ids, from, to));
      setStatus("saved");
    } catch {
      setStatus("error");
    } finally {
      saving.current = false;
    }
  }

  function endDrag(event: DragEndEvent) {
    suppressDropClick(event);
    const { active, over } = event;
    if (
      !over ||
      ids.length !== dragStartIds.current.length ||
      ids.some((id, index) => id !== dragStartIds.current[index])
    )
      return;
    void move(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
  }

  function renderTransition(row: AnimatedSidebarWaveTreeRow) {
    return (
      <SidebarWaveTreeRowTransition
        key={row.key}
        row={row}
        rowHeight={getRowHeight(row)}
      >
        {renderRow(row)}
      </SidebarWaveTreeRowTransition>
    );
  }

  return (
    <section aria-label={t(locale, "waves.sidebar.pinned")}>
      <div ref={listRef}>
        <DndContext
          sensors={sensors}
          accessibility={{
            screenReaderInstructions: {
              draggable: t(locale, "waves.sidebar.dragInstructions"),
            },
            announcements: {
              onDragStart: () => t(locale, "waves.sidebar.dragStarted"),
              onDragOver: ({ over }) => {
                const position = ids.indexOf(String(over?.id)) + 1;
                return position > 0
                  ? t(locale, "waves.sidebar.dragPosition", { position })
                  : undefined;
              },
              onDragEnd: () => undefined,
              onDragCancel: () => t(locale, "waves.sidebar.dragCancelled"),
            },
          }}
          collisionDetection={closestCenter}
          onDragStart={() => {
            dragStartIds.current = ids;
          }}
          onDragEnd={endDrag}
          onDragCancel={suppressDropClick}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {groups.map((group) => (
              <SortablePinnedWave
                key={group.id}
                group={group}
                controls={Boolean(onReorder) && !isSaving && ids.length > 1}
                renderRow={renderTransition}
              />
            ))}
          </SortableContext>
        </DndContext>
        {hasLoadingError && (
          <div className="tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-3 tw-text-sm tw-text-iron-300">
            <p role="alert">{t(locale, "waves.sidebar.pinsLoadError")}</p>
            <button
              type="button"
              className="tw-rounded-md tw-bg-iron-800 tw-px-3 tw-py-1 tw-text-iron-100"
              aria-label={t(locale, "waves.sidebar.pinsRetryLabel")}
              onClick={() => void onRetry?.()}
            >
              {t(locale, "waves.sidebar.joinedRetry")}
            </button>
          </div>
        )}
      </div>
      {status === "error" && !hasLoadingError && (
        <p role="alert" className="tw-px-4 tw-py-1 tw-text-xs tw-text-iron-300">
          {t(locale, "waves.sidebar.pinOrderSaveError")}
        </p>
      )}
      <output className="tw-sr-only">
        {status === "saved" && t(locale, "waves.sidebar.pinOrderSaved")}
      </output>
    </section>
  );
}

export function usePinnedSidebarList(
  showPins: boolean,
  profileKey: string,
  props: SidebarPinnedWavesProps
) {
  const { waves } = useMyStream();
  if (!showPins || (props.rows.length === 0 && !waves.hasPinnedWavesError)) {
    return null;
  }
  return <SidebarPinnedWaves key={profileKey} {...props} />;
}
