"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
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
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { Bars3Icon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { useRef, useState, type ReactNode, type RefObject } from "react";
import type { AnimatedSidebarWaveTreeRow } from "@/hooks/useAnimatedSidebarWaveRows";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { SidebarWaveTreeRowTransition } from "./SidebarWaveTreeRowTransition";

interface PinnedWaveGroup {
  readonly id: string;
  readonly name: string;
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
        name: row.wave.name,
        parent: row,
        children: [],
      });
    } else {
      groups.at(-1)?.children.push(row);
    }
  }
  return groups;
}

const ORDER_BUTTON_CLASS =
  "tw-inline-flex tw-size-9 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-bg-transparent tw-text-iron-400 hover:tw-bg-iron-800 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400";

function SortablePinnedWave({
  group,
  controls,
  canMoveUp,
  canMoveDown,
  onMove,
  renderRow,
}: {
  readonly group: PinnedWaveGroup;
  readonly controls: boolean;
  readonly canMoveUp: boolean;
  readonly canMoveDown: boolean;
  readonly onMove: (distance: number) => void;
  readonly renderRow: (row: AnimatedSidebarWaveTreeRow) => ReactNode;
}) {
  const locale = useBrowserLocale();
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

  return (
    <div
      ref={setNodeRef}
      className="motion-reduce:tw-!transition-none tw-min-w-0"
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : undefined,
      }}
    >
      <div className="tw-flex tw-items-center">
        <div className="tw-min-w-0 tw-flex-1">{renderRow(parent)}</div>
        {controls && (
          <div className="tw-mr-2 tw-flex tw-shrink-0 tw-gap-1">
            <button
              type="button"
              ref={setActivatorNodeRef}
              {...attributes}
              {...listeners}
              className={`${ORDER_BUTTON_CLASS} tw-cursor-grab tw-touch-none active:tw-cursor-grabbing`}
              aria-label={t(locale, "waves.sidebar.dragWave", {
                waveName: group.name,
              })}
            >
              <Bars3Icon aria-hidden="true" className="tw-size-4" />
            </button>
            <Menu>
              <MenuButton
                type="button"
                className={ORDER_BUTTON_CLASS}
                aria-label={t(locale, "waves.sidebar.reorderWave", {
                  waveName: group.name,
                })}
              >
                <EllipsisVerticalIcon
                  aria-hidden="true"
                  className="tw-size-4"
                />
              </MenuButton>
              <MenuItems
                anchor="bottom end"
                className="tw-z-[10000] tw-min-w-32 tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-900 tw-p-1 tw-text-sm tw-text-iron-100 tw-shadow-lg"
              >
                <MenuItem disabled={!canMoveUp}>
                  <button
                    type="button"
                    className="tw-block tw-w-full tw-rounded-md tw-px-3 tw-py-2 tw-text-start data-[focus]:tw-bg-iron-800 disabled:tw-text-iron-500"
                    onClick={() => onMove(-1)}
                  >
                    {t(locale, "waves.sidebar.movePinUp")}
                  </button>
                </MenuItem>
                <MenuItem disabled={!canMoveDown}>
                  <button
                    type="button"
                    className="tw-block tw-w-full tw-rounded-md tw-px-3 tw-py-2 tw-text-start data-[focus]:tw-bg-iron-800 disabled:tw-text-iron-500"
                    onClick={() => onMove(1)}
                  >
                    {t(locale, "waves.sidebar.movePinDown")}
                  </button>
                </MenuItem>
              </MenuItems>
            </Menu>
          </div>
        )}
      </div>
      {children.map(renderRow)}
    </div>
  );
}

export function SidebarPinnedWaves({
  listRef,
  rows,
  getRowHeight,
  renderRow,
}: SidebarPinnedWavesProps) {
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [status, setStatus] = useState<"saved" | "error" | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function move(from: number, to: number) {
    if (
      !onReorder ||
      isSaving ||
      saving.current ||
      from < 0 ||
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

  function endDrag({ active, over }: DragEndEvent) {
    setActiveId(null);
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

  const activeGroup = groups.find((group) => group.id === activeId);

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
          onDragStart={({ active }) => {
            dragStartIds.current = ids;
            setActiveId(String(active.id));
          }}
          onDragEnd={endDrag}
          onDragCancel={() => setActiveId(null)}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {groups.map((group, index) => (
              <SortablePinnedWave
                key={group.id}
                group={group}
                controls={Boolean(onReorder) && ids.length > 1}
                canMoveUp={!isSaving && index > 0}
                canMoveDown={!isSaving && index < ids.length - 1}
                onMove={(distance) => void move(index, index + distance)}
                renderRow={renderTransition}
              />
            ))}
          </SortableContext>
          <DragOverlay dropAnimation={null} zIndex={10001}>
            {activeGroup && (
              <div className="tw-pointer-events-none tw-mx-2 tw-max-w-full tw-truncate tw-rounded-lg tw-border tw-border-iron-600 tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-sm tw-text-iron-100 tw-shadow-lg">
                {activeGroup.name}
              </div>
            )}
          </DragOverlay>
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
