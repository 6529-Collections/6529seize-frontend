"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  ImageMediaModal,
  requestCenteredImageFullscreen,
} from "@/components/drops/view/item/content/media/ImageMediaModal";
import { useMediaActions } from "@/components/drops/view/item/content/media/useMediaActions";
import useCapacitor from "@/hooks/useCapacitor";
import type {
  DropImageGalleryItem,
  DropImageGallerySource,
} from "./dropImageGallery";

interface DropImageGalleryContextValue {
  readonly openImage: (
    src: string,
    source: DropImageGallerySource
  ) => boolean;
}

const DropImageGalleryContext =
  createContext<DropImageGalleryContextValue | null>(null);

export const useDropImageGallery = (): DropImageGalleryContextValue | null =>
  useContext(DropImageGalleryContext);

const findGalleryItem = ({
  items,
  source,
  src,
}: {
  readonly items: readonly DropImageGalleryItem[];
  readonly source: DropImageGallerySource;
  readonly src: string;
}): DropImageGalleryItem | null =>
  items.find((item) => item.source === source && item.src === src) ??
  items.find((item) => item.src === src) ??
  null;

export function DropImageGalleryProvider({
  children,
  items,
}: {
  readonly children: ReactNode;
  readonly items: readonly DropImageGalleryItem[];
}) {
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const modalImageRef = useRef<HTMLImageElement>(null);
  const { isCapacitor } = useCapacitor();

  const activeIndex = activeItemId
    ? items.findIndex((item) => item.id === activeItemId)
    : -1;
  const activeItem = activeIndex >= 0 ? items[activeIndex] : undefined;
  const activeSrc = activeItem?.src ?? "";
  const canGoPrevious = activeIndex > 0;
  const canGoNext = activeIndex >= 0 && activeIndex + 1 < items.length;

  const { downloadMedia, isDownloading, openLabel, openMedia } =
    useMediaActions({
      url: activeSrc,
      fallbackFileName: "image",
      dialogTitle: "Save image",
      mimeType: "image",
    });

  useEffect(() => {
    if (!activeItemId) {
      return;
    }

    if (!items.some((item) => item.id === activeItemId)) {
      setActiveItemId(null);
    }
  }, [activeItemId, items]);

  const openImage = useCallback(
    (src: string, source: DropImageGallerySource) => {
      const item = findGalleryItem({ items, source, src });
      if (!item) {
        return false;
      }

      setActiveItemId(item.id);
      return true;
    },
    [items]
  );

  const goToPrevious = useCallback(() => {
    setActiveItemId((currentId) => {
      const currentIndex = items.findIndex((item) => item.id === currentId);
      if (currentIndex <= 0) {
        return currentId;
      }

      return items[currentIndex - 1]?.id ?? currentId;
    });
  }, [items]);

  const goToNext = useCallback(() => {
    setActiveItemId((currentId) => {
      const currentIndex = items.findIndex((item) => item.id === currentId);
      if (currentIndex < 0 || currentIndex + 1 >= items.length) {
        return currentId;
      }

      return items[currentIndex + 1]?.id ?? currentId;
    });
  }, [items]);

  const handleClose = useCallback(() => {
    setActiveItemId(null);
  }, []);

  const handleFullScreen = useCallback(() => {
    const fullscreenTarget = modalImageRef.current;
    if (fullscreenTarget) {
      requestCenteredImageFullscreen(fullscreenTarget);
    }
  }, []);

  const value = useMemo(
    () => ({
      openImage,
    }),
    [openImage]
  );

  return (
    <DropImageGalleryContext.Provider value={value}>
      {children}
      {activeItem && (
        <ImageMediaModal
          src={activeItem.src}
          imageRef={modalImageRef}
          onClose={handleClose}
          onOpen={openMedia}
          openLabel={openLabel}
          onDownload={downloadMedia}
          isDownloading={isDownloading}
          onFullscreen={handleFullScreen}
          fullscreenTargetAvailable={!isCapacitor}
          gallery={{
            canGoNext,
            canGoPrevious,
            currentIndex: activeIndex,
            onNext: goToNext,
            onPrevious: goToPrevious,
            total: items.length,
          }}
        />
      )}
    </DropImageGalleryContext.Provider>
  );
}
