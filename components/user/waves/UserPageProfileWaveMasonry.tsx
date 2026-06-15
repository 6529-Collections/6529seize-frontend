"use client";

import { useAuth } from "@/components/auth/Auth";
import CurationEmptyState from "@/components/brain/my-stream/curations/CurationEmptyState";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import CommonIntersectionElement from "@/components/utils/CommonIntersectionElement";
import {
  type ProfileIdentitySummary,
  SortableUserPageProfileWaveMasonryCard,
  UserPageProfileWaveMasonryCard,
} from "@/components/user/waves/UserPageProfileWaveMasonryCard";
import {
  applyDropOrderIds,
  areDropOrdersEqual,
  getDropOrderIds,
  getDropOrderUpdates,
  getRollbackOrderIds,
} from "@/components/user/waves/userPageProfileWaveMasonryOrder.helpers";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropCurationOrderMutation } from "@/hooks/drops/useDropCurationOrderMutation";
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
} from "@dnd-kit/sortable";
import {
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
  readonly canReorderDrops?: boolean | undefined;
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

const getProfileMasonryColumnKey = ({
  column,
  prefix,
}: {
  readonly column: readonly ExtendedDrop[];
  readonly prefix: string;
}) => `${prefix}-${column.map((drop) => drop.id).join("|")}`;

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
export default function UserPageProfileWaveMasonry({
  wave,
  curationId,
  curationName,
  canManageProfileWave = false,
  canReorderDrops,
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
  const canManageActiveCuration = canManageProfileWave;
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
  const canEnterReorder =
    canReorderDrops ?? (canManageActiveCuration && drops.length > 1);
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
    () =>
      buildProfileMasonryColumns(drops, columnCount).filter(
        (column) => column.length > 0
      ),
    [columnCount, drops]
  );
  const reorderColumns = useMemo(
    () =>
      buildProfileMasonryColumns(reorderDrops, columnCount).filter(
        (column) => column.length > 0
      ),
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
      const rollbackOrderIds = getRollbackOrderIds({
        currentDrops,
        persistedOrderIds,
      });

      if (areDropOrdersEqual(nextOrderIds, persistedOrderIds)) {
        return;
      }

      const updates = getDropOrderUpdates(nextDrops);

      if (updates.length === 0) {
        persistedOrderIdsRef.current = nextOrderIds;
        return;
      }

      try {
        await persistOrderAsync(updates);
        persistedOrderIdsRef.current = nextOrderIds;
      } catch {
        try {
          const authoritativeDrops = await fetchAllWaveCurationDrops({
            wave,
            curationId,
            pageSize: REORDER_PAGE_SIZE,
          });
          persistedOrderIdsRef.current = getDropOrderIds(authoritativeDrops);
          updateReorderDrops(authoritativeDrops);
        } catch {
          updateReorderDrops(applyDropOrderIds(currentDrops, rollbackOrderIds));
        }
      }
    },
    [
      curationId,
      isPreparingReorder,
      isSavingOrder,
      persistOrderAsync,
      updateReorderDrops,
      wave,
    ]
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
            {reorderColumns.map((column) => (
              <div
                key={getProfileMasonryColumnKey({
                  column,
                  prefix: "reorder-column",
                })}
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
        {browseColumns.map((column) => (
          <div
            key={getProfileMasonryColumnKey({
              column,
              prefix: "browse-column",
            })}
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
