"use client";

import { useAuth } from "@/components/auth/Auth";
import CurationEmptyState from "@/components/brain/my-stream/curations/CurationEmptyState";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { Spinner } from "@/components/dotLoader/DotLoader";
import CommonIntersectionElement from "@/components/utils/CommonIntersectionElement";
import MoveIcon from "@/components/utils/icons/MoveIcon";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import Drop, { DropLocation } from "@/components/waves/drops/Drop";
import DropMinimalIdentityRow from "@/components/waves/drops/DropMinimalIdentityRow";
import WaveDropContent from "@/components/waves/drops/WaveDropContent";
import WaveDropAuthorPfp from "@/components/waves/drops/WaveDropAuthorPfp";
import WaveDropMetadata from "@/components/waves/drops/WaveDropMetadata";
import WaveDropReply from "@/components/waves/drops/WaveDropReply";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ImageScale } from "@/helpers/image.helpers";
import { areSameProfileIdentity } from "@/helpers/ProfileHelpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useCurationManagementPermission } from "@/hooks/useCurationManagementPermission";
import { useDropCurationOrderMutation } from "@/hooks/drops/useDropCurationOrderMutation";
import { useDropCurationMembershipMutation } from "@/hooks/drops/useDropCurationMembershipMutation";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import {
  fetchAllWaveCurationDrops,
  useWaveCurationDrops,
} from "@/hooks/useWaveCurationDrops";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface UserPageProfileWaveMasonryProps {
  readonly wave: ApiWave;
  readonly curationId: string;
  readonly curationName?: string | null | undefined;
  readonly canManageProfileWave?: boolean | undefined;
  readonly showIdentity?: boolean | undefined;
  readonly profileIdentity?: ProfileIdentitySummary | undefined;
  readonly isReorderMode?: boolean | undefined;
  readonly onReorderModeChange?:
    | ((nextIsReorderMode: boolean) => void)
    | undefined;
}

const MASONRY_COLUMN_WIDTH = 300;
const MASONRY_GUTTER = 16;
const REORDER_PAGE_SIZE = 100;

export type UserPageProfileWaveMasonryReorderState = {
  readonly canReorder: boolean;
  readonly isPreparing: boolean;
  readonly isSaving: boolean;
};

type ProfileIdentitySummary = {
  readonly id?: string | null | undefined;
  readonly handle?: string | null | undefined;
  readonly primary_address?: string | null | undefined;
};

type ProfileMasonryIdentityMode = "default" | "minimal" | "hidden";

type ProfileMasonryCardLayout = {
  readonly contentWrapperClassName: string;
  readonly identityMode: ProfileMasonryIdentityMode;
  readonly shouldUseInlineMinimalLayout: boolean;
  readonly showMinimalIdentityRow: boolean;
  readonly usesDefaultDropRenderer: boolean;
};

const getDropOrderIds = (drops: readonly ExtendedDrop[]): string[] =>
  drops.map((drop) => drop.id);

const areDropOrdersEqual = (
  left: readonly string[],
  right: readonly string[]
): boolean =>
  left.length === right.length &&
  left.every((id, index) => id === right[index]);

const applyDropOrderIds = (
  drops: readonly ExtendedDrop[],
  orderIds: readonly string[]
): ExtendedDrop[] => {
  const dropsById = new Map(drops.map((drop) => [drop.id, drop]));
  return orderIds
    .map((id) => dropsById.get(id) ?? null)
    .filter((drop): drop is ExtendedDrop => drop !== null);
};

const getDropOrderUpdates = ({
  drops,
  persistedOrderIds,
}: {
  readonly drops: readonly ExtendedDrop[];
  readonly persistedOrderIds: readonly string[];
}) =>
  drops.flatMap((drop, index) =>
    persistedOrderIds[index] === drop.id
      ? []
      : [
          {
            dropId: drop.id,
            priorityOrder: index + 1,
          },
        ]
  );

const buildProfileMasonryColumns = <T,>(
  items: readonly T[],
  columnCount: number
): T[][] => {
  const normalizedColumnCount = Math.max(1, columnCount);
  const columns = Array.from(
    { length: normalizedColumnCount },
    () => [] as T[]
  );

  items.forEach((item, index) => {
    columns[index % normalizedColumnCount]!.push(item);
  });

  return columns;
};

const getProfileMasonryCardLayout = ({
  activePart,
  drop,
  profileIdentity,
  replyTo,
  showIdentity,
}: {
  readonly activePart: ExtendedDrop["parts"][number] | undefined;
  readonly drop: ExtendedDrop;
  readonly profileIdentity: ProfileIdentitySummary | undefined;
  readonly replyTo: ExtendedDrop["reply_to"];
  readonly showIdentity: boolean;
}): ProfileMasonryCardLayout => {
  const isOwnProfileDrop = areSameProfileIdentity({
    left: drop.author,
    right: profileIdentity,
  });
  let identityMode: ProfileMasonryIdentityMode = "default";
  if (!showIdentity) {
    identityMode = isOwnProfileDrop ? "hidden" : "minimal";
  }
  const hasContentPadding =
    Boolean(replyTo) ||
    Boolean(activePart?.content?.trim()) ||
    Boolean(activePart?.quoted_drop?.drop_id) ||
    (activePart?.media.length ?? 0) === 0;
  const showMinimalIdentityRow = identityMode === "minimal";
  const shouldUseInlineMinimalLayout =
    showMinimalIdentityRow &&
    Boolean(activePart?.content?.trim()) &&
    !replyTo &&
    !activePart?.quoted_drop?.drop_id &&
    (activePart?.media.length ?? 0) === 0;
  let contentWrapperClassName = "tw-pt-2 tw-pb-2";
  if (hasContentPadding) {
    const topPaddingClass = showMinimalIdentityRow ? "tw-pt-2" : "tw-pt-4";
    contentWrapperClassName = `tw-px-4 ${topPaddingClass} tw-pb-4`;
  } else if (showMinimalIdentityRow) {
    contentWrapperClassName = "tw-pt-1 tw-pb-2";
  }

  return {
    contentWrapperClassName,
    identityMode,
    shouldUseInlineMinimalLayout,
    showMinimalIdentityRow,
    usesDefaultDropRenderer:
      showIdentity || drop.drop_type !== ApiDropType.Chat,
  };
};

function useProfileMasonryContainerWidth() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    setContainer(node);
    setContainerWidth((currentWidth) => {
      const nextWidth = node?.offsetWidth ?? 0;
      return currentWidth === nextWidth ? currentWidth : nextWidth;
    });
  }, []);

  useEffect(() => {
    if (!container) {
      return;
    }

    const updateWidth = () => {
      const nextWidth = container.offsetWidth;
      setContainerWidth((currentWidth) =>
        currentWidth === nextWidth ? currentWidth : nextWidth
      );
    };

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);
      return () => {
        window.removeEventListener("resize", updateWidth);
      };
    }

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [container]);

  return { containerRef, containerWidth };
}

function CurationMasonryRemoveButton({
  drop,
  curationId,
}: {
  readonly drop: ExtendedDrop;
  readonly curationId: string;
}) {
  const { hasTouchScreen, isApp } = useDeviceInfo();
  const isTouchDevice = useIsTouchDevice();
  const { updateMembership, isPending } = useDropCurationMembershipMutation({
    dropId: drop.id,
  });
  const shouldAlwaysShow = isTouchDevice || (isApp && hasTouchScreen);

  return (
    <div
      className={[
        "tw-pointer-events-none tw-absolute tw-right-3 tw-top-3 tw-z-[1000] tw-transition-all tw-duration-300",
        shouldAlwaysShow
          ? "tw-translate-y-0 tw-opacity-100"
          : "tw-translate-y-[-5px] tw-opacity-0 group-focus-within:tw-translate-y-0 group-focus-within:tw-opacity-100 group-hover:tw-translate-y-0 group-hover:tw-opacity-100",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          updateMembership(curationId, "remove");
        }}
        disabled={isPending}
        aria-label="Remove drop from this curation"
        title="Remove from wave"
        className="tw-pointer-events-auto tw-relative tw-z-[1000] tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-black/50 tw-text-iron-400 tw-shadow-lg tw-backdrop-blur-md tw-transition-all tw-duration-200 hover:tw-border-rose-500/30 hover:tw-bg-rose-500/20 hover:tw-text-rose-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
      >
        {isPending ? (
          <Spinner dimension={10} />
        ) : (
          <XMarkIcon className="tw-size-5 tw-flex-shrink-0" />
        )}
      </button>
    </div>
  );
}

function UserPageProfileWaveMasonryCard({
  drop,
  curationId,
  canManageActiveCuration,
  showIdentity,
  profileIdentity,
  isReorderMode,
  isDragging = false,
  reorderHandle = null,
}: {
  readonly drop: ExtendedDrop;
  readonly curationId: string;
  readonly canManageActiveCuration: boolean;
  readonly showIdentity: boolean;
  readonly profileIdentity: ProfileIdentitySummary | undefined;
  readonly isReorderMode: boolean;
  readonly isDragging?: boolean | undefined;
  readonly reorderHandle?: ReactNode;
}) {
  const [activePartIndex, setActivePartIndex] = useState(0);
  const replyTo = drop.reply_to;
  const activePart = drop.parts[activePartIndex] ?? drop.parts[0];
  const layout = getProfileMasonryCardLayout({
    activePart,
    drop,
    profileIdentity,
    replyTo,
    showIdentity,
  });

  const removeButton =
    canManageActiveCuration && !isReorderMode ? (
      <CurationMasonryRemoveButton drop={drop} curationId={curationId} />
    ) : null;
  const dropContent = (
    <WaveDropContent
      drop={drop}
      activePartIndex={activePartIndex}
      setActivePartIndex={setActivePartIndex}
      onQuoteClick={(_quotedDrop: ApiDrop) => {}}
      onLongPress={() => {}}
      setLongPressTriggered={(_triggered: boolean) => {}}
      onDropContentClick={undefined}
      mediaImageScale={ImageScale.AUTOx1080}
      fullWidthMedia={true}
    />
  );

  if (layout.usesDefaultDropRenderer) {
    return (
      <article
        className={`tw-group tw-relative tw-isolate ${
          isDragging ? "tw-opacity-70" : ""
        }`}
      >
        {removeButton}
        {reorderHandle}

        <div className={isReorderMode ? "tw-pointer-events-none" : ""}>
          <Drop
            drop={drop}
            previousDrop={null}
            nextDrop={null}
            showWaveInfo={false}
            activeDrop={null}
            showReplyAndQuote={false}
            location={DropLocation.MY_STREAM}
            dropViewDropId={null}
            onReply={() => {}}
            onReplyClick={() => {}}
            onQuoteClick={() => {}}
            identityMode={layout.identityMode}
            showInteractions={false}
          />
        </div>
      </article>
    );
  }

  return (
    <article
      className={`tw-group tw-relative tw-isolate ${
        isDragging ? "tw-opacity-70" : ""
      }`}
    >
      {removeButton}
      {reorderHandle}

      <div className={isReorderMode ? "tw-pointer-events-none" : ""}>
        <div className="tw-overflow-hidden tw-rounded-xl tw-bg-black/70 tw-ring-1 tw-ring-inset tw-ring-white/10">
          {layout.shouldUseInlineMinimalLayout ? (
            <div className="tw-flex tw-items-start tw-gap-x-3 tw-px-4 tw-pb-4 tw-pt-4">
              <WaveDropAuthorPfp drop={drop} />
              <div className="tw-min-w-0 tw-flex-1">
                <DropMinimalIdentityRow drop={drop} />
                <div className="tw-mt-2">{dropContent}</div>
                {drop.metadata.length > 0 && (
                  <WaveDropMetadata metadata={drop.metadata} />
                )}
              </div>
            </div>
          ) : (
            <>
              {layout.showMinimalIdentityRow && (
                <div className="tw-flex tw-items-start tw-gap-x-3 tw-px-4 tw-pt-4">
                  <WaveDropAuthorPfp drop={drop} />
                  <div className="tw-min-w-0 tw-flex-1">
                    <DropMinimalIdentityRow drop={drop} />
                  </div>
                </div>
              )}

              <div className={layout.contentWrapperClassName}>
                {replyTo && (
                  <div className="tw-mb-3">
                    <WaveDropReply
                      dropId={replyTo.drop_id}
                      dropPartId={replyTo.drop_part_id}
                      maybeDrop={
                        replyTo.drop
                          ? { ...replyTo.drop, wave: drop.wave }
                          : null
                      }
                      onReplyClick={(_serialNo: number) => {}}
                    />
                  </div>
                )}

                {dropContent}
              </div>

              {drop.metadata.length > 0 && (
                <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-px-4 tw-pb-4">
                  <WaveDropMetadata metadata={drop.metadata} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function SortableUserPageProfileWaveMasonryCard({
  drop,
  index,
  curationId,
  canManageActiveCuration,
  showIdentity,
  profileIdentity,
  isSavingOrder,
}: {
  readonly drop: ExtendedDrop;
  readonly index: number;
  readonly curationId: string;
  readonly canManageActiveCuration: boolean;
  readonly showIdentity: boolean;
  readonly profileIdentity: ProfileIdentitySummary | undefined;
  readonly isSavingOrder: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: drop.id,
    disabled: isSavingOrder,
  });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const reorderHandle = (
    <div className="tw-pointer-events-none tw-absolute tw-right-3 tw-top-3 tw-z-[1000]">
      <button
        type="button"
        {...attributes}
        {...listeners}
        disabled={isSavingOrder}
        aria-label={`Drag to reorder drop ${index + 1}`}
        title="Drag to reorder"
        className="tw-pointer-events-auto tw-inline-flex tw-size-8 tw-cursor-grab tw-touch-none tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-black/60 tw-text-iron-200 tw-backdrop-blur-md tw-transition-all tw-duration-200 hover:tw-border-white/20 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 active:tw-cursor-grabbing disabled:tw-cursor-not-allowed disabled:tw-opacity-40"
      >
        <MoveIcon className="tw-size-4 tw-flex-shrink-0" />
      </button>
    </div>
  );

  return (
    <div ref={setNodeRef} style={style} className="tw-min-w-0">
      <UserPageProfileWaveMasonryCard
        drop={drop}
        curationId={curationId}
        canManageActiveCuration={canManageActiveCuration}
        showIdentity={showIdentity}
        profileIdentity={profileIdentity}
        isReorderMode={true}
        isDragging={isDragging}
        reorderHandle={reorderHandle}
      />
    </div>
  );
}

export default function UserPageProfileWaveMasonry({
  wave,
  curationId,
  curationName,
  canManageProfileWave = false,
  showIdentity = false,
  profileIdentity,
  isReorderMode = false,
  onReorderModeChange,
}: UserPageProfileWaveMasonryProps) {
  const { setToast } = useAuth();
  const { drops, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useWaveCurationDrops({
      wave,
      curationId,
    });
  const { persistOrderAsync, isPending: isSavingOrder } =
    useDropCurationOrderMutation({
      curationId,
    });
  const permissionProbeDropId = drops[0]?.id ?? "";
  const canManageActiveCurationFromProbe = useCurationManagementPermission({
    curationId,
    probeDropId: permissionProbeDropId,
    enabled: !canManageProfileWave,
  });
  const canManageActiveCuration =
    canManageProfileWave || canManageActiveCurationFromProbe;
  const isInitialLoading = isFetching && drops.length === 0;
  const curationTitle = curationName?.trim() ?? "Curation";
  const { containerRef, containerWidth } = useProfileMasonryContainerWidth();
  const [isPreparingReorder, setIsPreparingReorder] = useState(false);
  const [reorderDrops, setReorderDrops] = useState<ExtendedDrop[]>([]);
  const reorderDropsRef = useRef<ExtendedDrop[]>([]);
  const persistedOrderIdsRef = useRef<string[]>([]);
  const updateReorderDrops = useCallback((nextDrops: ExtendedDrop[]) => {
    reorderDropsRef.current = nextDrops;
    setReorderDrops(nextDrops);
  }, []);
  const canEnterReorder = canManageActiveCuration && drops.length > 1;
  const isReorderContentLoading =
    isReorderMode && (isPreparingReorder || reorderDrops.length === 0);
  const columnCount = Math.max(
    1,
    Math.floor(
      (containerWidth + MASONRY_GUTTER) /
        (MASONRY_COLUMN_WIDTH + MASONRY_GUTTER)
    )
  );
  const browseColumns = useMemo(
    () => buildProfileMasonryColumns(drops, columnCount),
    [columnCount, drops]
  );
  const reorderColumns = useMemo(
    () => buildProfileMasonryColumns(reorderDrops, columnCount),
    [columnCount, reorderDrops]
  );
  const reorderIndicesById = useMemo(
    () => new Map(reorderDrops.map((drop, index) => [drop.id, index])),
    [reorderDrops]
  );
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleBottomIntersection = useCallback(
    (isIntersecting: boolean) => {
      if (!isIntersecting || !hasNextPage || isFetchingNextPage) {
        return;
      }

      fetchNextPage().catch(() => undefined);
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  const handleDragEnd = useCallback(
    async ({ active, over }: DragEndEvent) => {
      if (
        !over ||
        active.id === over.id ||
        isPreparingReorder ||
        isSavingOrder
      ) {
        return;
      }

      const currentDrops = reorderDropsRef.current;
      const fromIndex = currentDrops.findIndex((drop) => drop.id === active.id);
      const toIndex = currentDrops.findIndex((drop) => drop.id === over.id);

      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
        return;
      }

      const nextDrops = arrayMove(currentDrops, fromIndex, toIndex);
      updateReorderDrops(nextDrops);

      const nextOrderIds = getDropOrderIds(nextDrops);
      const persistedOrderIds = persistedOrderIdsRef.current;

      if (areDropOrdersEqual(nextOrderIds, persistedOrderIds)) {
        return;
      }

      const updates = getDropOrderUpdates({
        drops: nextDrops,
        persistedOrderIds,
      });

      if (updates.length === 0) {
        persistedOrderIdsRef.current = nextOrderIds;
        return;
      }

      try {
        await persistOrderAsync(updates);
        persistedOrderIdsRef.current = nextOrderIds;
      } catch {
        updateReorderDrops(
          applyDropOrderIds(currentDrops, persistedOrderIdsRef.current)
        );
      }
    },
    [isPreparingReorder, isSavingOrder, persistOrderAsync, updateReorderDrops]
  );

  useEffect(() => {
    if (!isReorderMode || !canEnterReorder) {
      return;
    }

    let isCancelled = false;

    const prepareReorder = async () => {
      setIsPreparingReorder(true);

      try {
        const allDrops = await fetchAllWaveCurationDrops({
          wave,
          curationId,
          pageSize: REORDER_PAGE_SIZE,
        });

        if (isCancelled) {
          return;
        }

        persistedOrderIdsRef.current = getDropOrderIds(allDrops);
        updateReorderDrops(allDrops);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        const message =
          error instanceof Error && error.message.trim().length > 0
            ? error.message
            : "Unable to load curation reorder mode.";

        setToast({
          type: "error",
          message,
        });
        onReorderModeChange?.(false);
      } finally {
        if (!isCancelled) {
          setIsPreparingReorder(false);
        }
      }
    };

    prepareReorder().catch(() => undefined);

    return () => {
      isCancelled = true;
    };
  }, [
    canEnterReorder,
    curationId,
    isReorderMode,
    onReorderModeChange,
    setToast,
    updateReorderDrops,
    wave,
  ]);

  if (isInitialLoading) {
    return (
      <div className="tw-flex tw-min-h-[20rem] tw-items-center tw-justify-center">
        <CircleLoader size={CircleLoaderSize.XXLARGE} />
      </div>
    );
  }

  if (drops.length === 0) {
    return <CurationEmptyState curationTitle={curationTitle} />;
  }

  let masonryContent: ReactNode;

  if (containerWidth <= 0) {
    masonryContent = (
      <div className="tw-flex tw-min-h-[12rem] tw-items-center tw-justify-center">
        <CircleLoader size={CircleLoaderSize.MEDIUM} />
      </div>
    );
  } else if (isReorderMode) {
    masonryContent = isReorderContentLoading ? (
      <div className="tw-flex tw-min-h-[12rem] tw-items-center tw-justify-center">
        <CircleLoader size={CircleLoaderSize.MEDIUM} />
      </div>
    ) : (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(event) => {
          handleDragEnd(event).catch(() => undefined);
        }}
      >
        <SortableContext
          items={reorderDrops.map((drop) => drop.id)}
          strategy={rectSortingStrategy}
        >
          <div
            className="tw-flex tw-items-start"
            style={{ gap: `${MASONRY_GUTTER}px` }}
          >
            {reorderColumns.map((column, columnIndex) => (
              <div
                key={`reorder-column-${columnIndex}`}
                className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col"
                style={{ gap: `${MASONRY_GUTTER}px` }}
              >
                {column.map((drop) => (
                  <SortableUserPageProfileWaveMasonryCard
                    key={drop.id}
                    drop={drop}
                    index={reorderIndicesById.get(drop.id) ?? 0}
                    curationId={curationId}
                    canManageActiveCuration={canManageActiveCuration}
                    showIdentity={showIdentity}
                    profileIdentity={profileIdentity}
                    isSavingOrder={isSavingOrder}
                  />
                ))}
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  } else {
    masonryContent = (
      <div
        className="tw-flex tw-items-start"
        style={{ gap: `${MASONRY_GUTTER}px` }}
      >
        {browseColumns.map((column, columnIndex) => (
          <div
            key={`browse-column-${columnIndex}`}
            className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col"
            style={{ gap: `${MASONRY_GUTTER}px` }}
          >
            {column.map((drop) => (
              <UserPageProfileWaveMasonryCard
                key={drop.stableKey}
                drop={drop}
                curationId={curationId}
                canManageActiveCuration={canManageActiveCuration}
                showIdentity={showIdentity}
                profileIdentity={profileIdentity}
                isReorderMode={false}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="tw-px-1 tw-pb-2">
      {masonryContent}

      {!isReorderMode && (hasNextPage || isFetchingNextPage) && (
        <div className="tw-flex tw-justify-center tw-py-6">
          {isFetchingNextPage ? (
            <CircleLoader size={CircleLoaderSize.MEDIUM} />
          ) : (
            <CommonIntersectionElement
              onIntersection={handleBottomIntersection}
            />
          )}
        </div>
      )}
    </div>
  );
}
