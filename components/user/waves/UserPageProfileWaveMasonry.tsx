"use client";

import CurationEmptyState from "@/components/brain/my-stream/curations/CurationEmptyState";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { Spinner } from "@/components/dotLoader/DotLoader";
import CommonIntersectionElement from "@/components/utils/CommonIntersectionElement";
import { ApiDropType } from "@/generated/models/ApiDropType";
import CurationDropFooter from "@/components/waves/drops/CurationDropFooter";
import Drop, { DropLocation } from "@/components/waves/drops/Drop";
import DropMinimalIdentityRow from "@/components/waves/drops/DropMinimalIdentityRow";
import WaveDropContent from "@/components/waves/drops/WaveDropContent";
import WaveDropAuthorPfp from "@/components/waves/drops/WaveDropAuthorPfp";
import WaveDropMetadata from "@/components/waves/drops/WaveDropMetadata";
import WaveDropReply from "@/components/waves/drops/WaveDropReply";
import { ImageScale } from "@/helpers/image.helpers";
import { areSameProfileIdentity } from "@/helpers/ProfileHelpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useCurationManagementPermission } from "@/hooks/useCurationManagementPermission";
import { useDropCurationMembershipMutation } from "@/hooks/drops/useDropCurationMembershipMutation";
import { useNavigateToDropWave } from "@/hooks/useNavigateToDropWave";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Masonry } from "masonic";
import { useCallback, useEffect, useMemo, useState } from "react";

interface UserPageProfileWaveMasonryProps {
  readonly curationId: string;
  readonly curationName?: string | null | undefined;
  readonly containerWidth: number;
  readonly drops: readonly ExtendedDrop[];
  readonly fetchNextPage: () => Promise<void>;
  readonly hasNextPage: boolean | undefined;
  readonly isFetchingNextPage: boolean;
  readonly showIdentity?: boolean | undefined;
  readonly profileIdentity?: ProfileIdentitySummary | undefined;
}

const MASONRY_COLUMN_WIDTH = 300;
const MASONRY_GUTTER = 16;
const noop = () => {};
const CURATION_CARD_CLASS_NAME =
  "tw-group tw-relative tw-isolate tw-rounded-xl";
const CURATION_CARD_HOVER_FRAME_CLASS_NAME =
  "tw-pointer-events-none tw-absolute tw-inset-0 tw-z-10 tw-rounded-xl tw-border tw-border-solid tw-border-transparent tw-transition-colors tw-duration-200 tw-ease-out desktop-hover:group-hover:tw-border-white/10 motion-reduce:tw-transition-none";

export type ProfileIdentitySummary = {
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

type ProfileMasonryItem = {
  readonly drop: ExtendedDrop;
  readonly curationId: string;
  readonly canManageActiveCuration: boolean;
  readonly showIdentity: boolean;
  readonly profileIdentity: ProfileIdentitySummary | undefined;
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

export function useProfileMasonryContainerWidth() {
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
}: {
  readonly drop: ExtendedDrop;
  readonly curationId: string;
  readonly canManageActiveCuration: boolean;
  readonly showIdentity: boolean;
  readonly profileIdentity: ProfileIdentitySummary | undefined;
}) {
  const [activePartIndex, setActivePartIndex] = useState(0);
  const replyTo = drop.reply_to;
  const activePart = drop.parts[activePartIndex] ?? drop.parts[0];
  const navigateToDropWave = useNavigateToDropWave();
  const layout = getProfileMasonryCardLayout({
    activePart,
    drop,
    profileIdentity,
    replyTo,
    showIdentity,
  });

  const removeButton = canManageActiveCuration ? (
    <CurationMasonryRemoveButton drop={drop} curationId={curationId} />
  ) : null;
  const dropContent = (
    <WaveDropContent
      drop={drop}
      activePartIndex={activePartIndex}
      setActivePartIndex={setActivePartIndex}
      onQuoteClick={navigateToDropWave}
      onLongPress={() => {}}
      setLongPressTriggered={(_triggered: boolean) => {}}
      onDropContentClick={navigateToDropWave}
      mediaImageScale={ImageScale.AUTOx1080}
      fullWidthMedia={true}
    />
  );

  if (layout.usesDefaultDropRenderer) {
    return (
      <article className={CURATION_CARD_CLASS_NAME}>
        {removeButton}

        <Drop
          drop={drop}
          previousDrop={null}
          nextDrop={null}
          showWaveInfo={false}
          activeDrop={null}
          showReplyAndQuote={false}
          location={DropLocation.MY_STREAM}
          dropViewDropId={null}
          onReply={noop}
          onReplyClick={noop}
          onQuoteClick={navigateToDropWave}
          onDropContentClick={navigateToDropWave}
          footer={<CurationDropFooter drop={drop} />}
          identityMode={layout.identityMode}
          timestampLayout="stacked"
          showInteractions={false}
        />
        <div
          aria-hidden="true"
          className={CURATION_CARD_HOVER_FRAME_CLASS_NAME}
        />
      </article>
    );
  }

  return (
    <article className={CURATION_CARD_CLASS_NAME}>
      {removeButton}

      <div className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950">
        {layout.shouldUseInlineMinimalLayout ? (
          <div className="tw-flex tw-items-start tw-gap-x-3 tw-px-4 tw-pb-4 tw-pt-4">
            <WaveDropAuthorPfp drop={drop} />
            <div className="tw-min-w-0 tw-flex-1">
              <DropMinimalIdentityRow drop={drop} timestampLayout="stacked" />
              <div className="tw-mt-2">{dropContent}</div>
              {drop.metadata.length > 0 && (
                <WaveDropMetadata metadata={drop.metadata} />
              )}
              <CurationDropFooter drop={drop} className="tw-mt-3" />
            </div>
          </div>
        ) : (
          <>
            {layout.showMinimalIdentityRow && (
              <div className="tw-flex tw-items-start tw-gap-x-3 tw-px-4 tw-pt-4">
                <WaveDropAuthorPfp drop={drop} />
                <div className="tw-min-w-0 tw-flex-1">
                  <DropMinimalIdentityRow
                    drop={drop}
                    timestampLayout="stacked"
                  />
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
                      replyTo.drop ? { ...replyTo.drop, wave: drop.wave } : null
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
            <CurationDropFooter
              drop={drop}
              className="tw-px-4 tw-pb-4 tw-pt-2"
            />
          </>
        )}
      </div>
      <div
        aria-hidden="true"
        className={CURATION_CARD_HOVER_FRAME_CLASS_NAME}
      />
    </article>
  );
}

function UserPageProfileWaveMasonryRenderItem({
  data,
}: {
  readonly data: ProfileMasonryItem;
}) {
  return (
    <UserPageProfileWaveMasonryCard
      drop={data.drop}
      curationId={data.curationId}
      canManageActiveCuration={data.canManageActiveCuration}
      showIdentity={data.showIdentity}
      profileIdentity={data.profileIdentity}
    />
  );
}

export default function UserPageProfileWaveMasonry({
  curationId,
  curationName,
  containerWidth,
  drops,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  showIdentity = false,
  profileIdentity,
}: UserPageProfileWaveMasonryProps) {
  const permissionProbeDropId = drops[0]?.id ?? "";
  const canManageActiveCuration = useCurationManagementPermission({
    curationId,
    probeDropId: permissionProbeDropId,
  });
  const curationTitle = curationName?.trim() ?? "Curation";
  const masonryItems = useMemo(
    () =>
      drops.map((drop) => ({
        drop,
        curationId,
        canManageActiveCuration,
        showIdentity,
        profileIdentity,
      })),
    [canManageActiveCuration, curationId, drops, profileIdentity, showIdentity]
  );
  const masonryTopItemsKey = useMemo(
    () =>
      drops
        .slice(0, 8)
        .map((drop) => drop.stableKey)
        .join("|"),
    [drops]
  );
  const masonryKey = `${curationId}-${containerWidth}-${drops.length}-${masonryTopItemsKey}`;

  const handleBottomIntersection = useCallback(
    (isIntersecting: boolean) => {
      if (!isIntersecting || !hasNextPage || isFetchingNextPage) {
        return;
      }

      fetchNextPage().catch(() => undefined);
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  if (drops.length === 0) {
    return <CurationEmptyState curationTitle={curationTitle} />;
  }

  return (
    <div className="tw-px-1 tw-pb-2">
      <Masonry
        key={masonryKey}
        items={masonryItems}
        render={UserPageProfileWaveMasonryRenderItem}
        itemKey={(item) => item.drop.stableKey}
        itemHeightEstimate={420}
        columnWidth={MASONRY_COLUMN_WIDTH}
        columnGutter={MASONRY_GUTTER}
        rowGutter={MASONRY_GUTTER}
        overscanBy={2}
        ssrWidth={containerWidth}
        ssrHeight={900}
      />

      {((hasNextPage ?? false) || isFetchingNextPage) && (
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
