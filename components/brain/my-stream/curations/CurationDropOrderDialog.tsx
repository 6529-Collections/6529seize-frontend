"use client";

import { useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  type Announcements,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { markdownToPlainText } from "@/helpers/waves/waveDescriptionPreview";
import { useWaveCurationDrops } from "@/hooks/useWaveCurationDrops";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
import {
  CurationOrderChangedError,
  moveCurationDrop,
  type CurationDropPlacement,
} from "@/services/api/curation-drop-order-api";

function getLabel(drop: ExtendedDrop, locale: SupportedLocale): string {
  const title = drop.title?.trim() ?? "";
  const content = drop.parts
    .map((part) =>
      markdownToPlainText(part.content ?? "")
        .replace(/\s+/g, " ")
        .trim()
    )
    .find(Boolean);
  const label = title.length > 0 ? title : content;
  if (label) {
    const characters = Array.from(label);
    return characters.length > 90
      ? `${characters.slice(0, 89).join("").trimEnd()}…`
      : label;
  }
  return t(locale, "profileCuration.order.postNumber", {
    number: new Intl.NumberFormat(locale).format(drop.serial_no),
  });
}

function reorderVisibleDrops(
  drops: readonly ExtendedDrop[],
  dropId: string,
  placement: CurationDropPlacement,
  anchorId?: string
): ExtendedDrop[] | null {
  const next = [...drops];
  const sourceIndex = next.findIndex((item) => item.id === dropId);
  if (sourceIndex < 0) return null;
  const [moved] = next.splice(sourceIndex, 1);
  if (!moved) return null;
  const anchorIndex = next.findIndex((item) => item.id === anchorId);
  if (anchorIndex < 0) return null;
  const targetIndex = anchorIndex + (placement === "after" ? 1 : 0);
  next.splice(targetIndex, 0, moved);
  return next;
}

function revealMovedPost(dropId: string, focusHandle = false) {
  requestAnimationFrame(() => {
    const row = Array.from(
      document.querySelectorAll<HTMLElement>("[data-curation-order-drop-id]")
    ).find((item) => item.dataset["curationOrderDropId"] === dropId);
    if (focusHandle) {
      row
        ?.querySelector<HTMLButtonElement>("[data-curation-order-handle]")
        ?.focus({ preventScroll: true });
    }
    row?.scrollIntoView({
      block: "nearest",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  });
}

function SortablePost({
  drop,
  index,
  disabled,
  isSelected,
  destinationLabel,
  onChoose,
  locale,
}: {
  readonly drop: ExtendedDrop;
  readonly index: number;
  readonly disabled: boolean;
  readonly isSelected: boolean;
  readonly destinationLabel: string | null;
  readonly locale: SupportedLocale;
  readonly onChoose: (dropId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: drop.id, disabled: disabled || !!destinationLabel });
  return (
    <li
      ref={setNodeRef}
      data-curation-order-drop-id={drop.id}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 2 : undefined,
      }}
      className={`tw-relative tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-p-3 ${
        isSelected || isDragging
          ? "tw-border-primary-400 tw-bg-iron-800"
          : "tw-border-iron-800 tw-bg-iron-900/70"
      }`}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        data-curation-order-handle
        disabled={disabled || !!destinationLabel}
        className="tw-flex tw-size-11 tw-shrink-0 tw-cursor-grab tw-touch-none tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-text-iron-400 hover:tw-bg-iron-800 hover:tw-text-iron-200 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 active:tw-cursor-grabbing"
        aria-label={t(locale, "profileCuration.order.handle", {
          postName: getLabel(drop, locale),
        })}
        {...attributes}
        {...listeners}
        aria-hidden={destinationLabel ? true : undefined}
        aria-pressed={isSelected || isDragging}
        onClick={() => onChoose(drop.id)}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="tw-size-5"
        >
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </button>
      <div className="tw-min-w-0 tw-flex-1">
        <div className="tw-flex tw-items-center tw-gap-2">
          <span className="tw-text-xs tw-tabular-nums tw-text-iron-500">
            {new Intl.NumberFormat(locale).format(index + 1)}
          </span>
          <span className="tw-truncate tw-text-sm tw-font-semibold tw-text-iron-200">
            {getLabel(drop, locale)}
          </span>
        </div>
        <span className="tw-text-xs tw-text-iron-500">
          @{drop.author.handle}
        </span>
      </div>
      {destinationLabel && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChoose(drop.id)}
          aria-label={destinationLabel}
          className="tw-absolute tw-inset-0 tw-rounded-lg tw-border-0 tw-bg-transparent hover:tw-bg-iron-700/20 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        />
      )}
    </li>
  );
}

export default function CurationDropOrderDialog({
  wave,
  curationId,
  curationName,
  isOpen,
  onClose,
}: {
  readonly wave: ApiWave;
  readonly curationId: string;
  readonly curationName: string;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}) {
  const locale = useBrowserLocale();
  const queryClient = useQueryClient();
  const { requestAuth, setToast } = useAuth();
  const {
    drops: savedDrops,
    dataUpdatedAt,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isError,
    refetch,
  } = useWaveCurationDrops({
    wave,
    curationId,
    pageSize: 100,
    enabled: isOpen,
  });
  const [override, setOverride] = useState<{
    updatedAt: number;
    drops: ExtendedDrop[];
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [selectedDropId, setSelectedDropId] = useState<string | null>(null);
  const drops =
    override !== null && (isSaving || override.updatedAt === dataUpdatedAt)
      ? override.drops
      : savedDrops;
  const selectedIndex = drops.findIndex((drop) => drop.id === selectedDropId);
  const selectedDrop = drops[selectedIndex];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const move = async (
    dropId: string,
    placement: CurationDropPlacement,
    anchorId?: string
  ) => {
    if (isSaving || !anchorId) return;
    setSelectedDropId(null);
    const next = reorderVisibleDrops(drops, dropId, placement, anchorId);
    if (!next) return;
    setOverride({ updatedAt: dataUpdatedAt, drops: next });
    setError("");
    const moved = next.find((item) => item.id === dropId);
    const newIndex = next.findIndex((item) => item.id === dropId);
    if (moved) {
      setAnnouncement(
        t(locale, "profileCuration.order.moved", {
          postName: getLabel(moved, locale),
          position: new Intl.NumberFormat(locale).format(newIndex + 1),
        })
      );
    }
    revealMovedPost(dropId);
    setIsSaving(true);
    try {
      const auth = await requestAuth();
      if (!auth.success) {
        throw new Error(
          t(locale, "profileCuration.manage.deleteAuthCancelled")
        );
      }
      await moveCurationDrop({
        dropId,
        curationId,
        placement,
        anchorDropId: anchorId,
      });
      await queryClient.invalidateQueries({
        queryKey: [QueryKey.DROPS],
        predicate: ({ queryKey }) => {
          const params = queryKey[1];
          if (typeof params !== "object" || params === null) return true;
          const options = params as Record<string, unknown>;
          // Keep the moved row visible in this editor until it is closed or refreshed.
          return !(
            options["context"] === "wave-curation-drops" &&
            options["waveId"] === wave.id &&
            options["curationId"] === curationId &&
            options["pageSize"] === 100
          );
        },
      });
      // Reconcile with saved order, including any changes another curator made.
      await refetch();
      setToast({
        type: "success",
        message: t(locale, "profileCuration.order.saved"),
      });
    } catch (cause) {
      setOverride(null);
      setAnnouncement("");
      let message = t(locale, "profileCuration.order.saveFailed");
      if (cause instanceof CurationOrderChangedError) {
        message = t(locale, "profileCuration.order.changed");
      } else if (cause instanceof Error) {
        message = cause.message;
      }
      setError(message);
      await refetch();
    } finally {
      setIsSaving(false);
      revealMovedPost(dropId, true);
    }
  };

  const moveToPost = (dropId: string, targetId: string) => {
    if (dropId === targetId) return;
    const oldIndex = drops.findIndex((item) => item.id === dropId);
    const newIndex = drops.findIndex((item) => item.id === targetId);
    if (oldIndex < 0 || newIndex < 0) return;
    void move(dropId, oldIndex > newIndex ? "before" : "after", targetId);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over) moveToPost(String(active.id), String(over.id));
  };

  const choosePost = (dropId: string) => {
    if (isSaving) return;
    if (selectedDrop && selectedDrop.id !== dropId) {
      moveToPost(selectedDrop.id, dropId);
      return;
    }
    setSelectedDropId(selectedDropId === dropId ? null : dropId);
  };

  const dragAnnouncements: Announcements = {
    onDragStart: ({ active }) => {
      const post = drops.find((drop) => drop.id === active.id);
      return post
        ? t(locale, "profileCuration.order.pickedUp", {
            postName: getLabel(post, locale),
          })
        : undefined;
    },
    onDragOver: ({ active, over }) => {
      const post = drops.find((drop) => drop.id === active.id);
      const position = drops.findIndex((drop) => drop.id === over?.id);
      if (!post || position < 0) return undefined;
      return t(locale, "profileCuration.order.previewPosition", {
        postName: getLabel(post, locale),
        position: new Intl.NumberFormat(locale).format(position + 1),
      });
    },
    onDragEnd: () => undefined,
    onDragCancel: () => t(locale, "profileCuration.order.cancelled"),
  };

  const loadMore = async () => {
    // A placement can change page boundaries; refresh before extending a stale page.
    if (override) {
      setOverride(null);
      await refetch();
    }
    await fetchNextPage();
  };

  let helpMessage = t(locale, "profileCuration.order.help");
  if (isSaving) {
    helpMessage = t(locale, "profileCuration.order.saving");
  } else if (selectedDrop) {
    helpMessage = t(locale, "profileCuration.order.chooseDestination");
  }

  return (
    <MobileWrapperDialog
      title={t(locale, "profileCuration.order.title", { curationName })}
      isOpen={isOpen}
      onClose={onClose}
      tabletModal
      tall
    >
      <div className="tailwind-scope tw-px-4 sm:tw-px-6">
        <p
          role="status"
          className="tw-mb-4 tw-min-h-10 tw-text-sm tw-text-iron-400"
        >
          {helpMessage}
        </p>
        {error && (
          <p
            role="alert"
            className="tw-mb-3 tw-rounded tw-bg-red/10 tw-p-3 tw-text-sm tw-text-red"
          >
            {error}
          </p>
        )}
        {announcement && (
          <p role="status" className="tw-sr-only">
            {announcement}
          </p>
        )}
        {isError && (
          <button
            type="button"
            onClick={() => void refetch()}
            className="tw-text-primary-400"
          >
            {t(locale, "profileCuration.order.loadFailed")}
          </button>
        )}
        {isFetching && drops.length === 0 && (
          <p role="status" className="tw-text-sm tw-text-iron-400">
            {t(locale, "profileCuration.order.loading")}
          </p>
        )}
        {!isFetching && !isError && drops.length === 0 && (
          <p className="tw-text-sm tw-text-iron-400">
            {t(locale, "profileCuration.order.empty")}
          </p>
        )}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          accessibility={{
            announcements: dragAnnouncements,
            screenReaderInstructions: {
              draggable: t(locale, "profileCuration.order.keyboardHelp"),
            },
          }}
          onDragStart={() => {
            setSelectedDropId(null);
            setAnnouncement("");
          }}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={drops.map((drop) => drop.id)}
            strategy={verticalListSortingStrategy}
          >
            <ol className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-2 tw-p-0">
              {drops.map((drop, index) => {
                let destinationLabel: string | null = null;
                if (selectedDrop && selectedDrop.id !== drop.id) {
                  const messageKey =
                    selectedIndex > index
                      ? "profileCuration.order.placeBefore"
                      : "profileCuration.order.placeAfter";
                  destinationLabel = t(locale, messageKey, {
                    postName: getLabel(selectedDrop, locale),
                    targetName: getLabel(drop, locale),
                  });
                }
                return (
                  <SortablePost
                    key={drop.id}
                    drop={drop}
                    index={index}
                    locale={locale}
                    disabled={isSaving || drops.length < 2}
                    isSelected={selectedDropId === drop.id}
                    destinationLabel={destinationLabel}
                    onChoose={choosePost}
                  />
                );
              })}
            </ol>
          </SortableContext>
        </DndContext>
        {hasNextPage && (
          <button
            type="button"
            disabled={isFetching || isSaving}
            onClick={() => void loadMore()}
            className="tw-mt-4 tw-w-full tw-rounded-lg tw-bg-iron-800 tw-p-3 tw-text-sm tw-text-iron-200 disabled:tw-opacity-50"
          >
            {t(locale, "profileCuration.order.loadMore")}
          </button>
        )}
      </div>
    </MobileWrapperDialog>
  );
}
