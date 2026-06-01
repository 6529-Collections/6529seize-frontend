"use client";

import {
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
import type { DropImageGalleryItem } from "./dropImageGallery";

interface DropImageGalleryContextValue {
  readonly openImage: (galleryItemId: string) => boolean;
}

const DropImageGalleryContext =
  createContext<DropImageGalleryContextValue | null>(null);

export const useDropImageGallery = (): DropImageGalleryContextValue | null =>
  useContext(DropImageGalleryContext);

export function DropImageGalleryProvider({
  children,
  items,
}: {
  readonly children: ReactNode;
  readonly items: readonly DropImageGalleryItem[];
}) {
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  const activeIndex = activeItemId
    ? items.findIndex((item) => item.id === activeItemId)
    : -1;
  const activeItem = activeIndex >= 0 ? items[activeIndex] : undefined;
  const canGoPrevious = activeIndex > 0;
  const canGoNext = activeIndex >= 0 && activeIndex + 1 < items.length;

  useEffect(() => {
    if (!activeItemId) {
      return;
    }

    if (!items.some((item) => item.id === activeItemId)) {
      setActiveItemId(null);
    }
  }, [activeItemId, items]);

  const openImage = useCallback(
    (galleryItemId: string) => {
      const item = items.find(
        (galleryItem) => galleryItem.id === galleryItemId
      );
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
        <DropImageGalleryModal
          activeIndex={activeIndex}
          activeItem={activeItem}
          canGoNext={canGoNext}
          canGoPrevious={canGoPrevious}
          onClose={handleClose}
          onNext={goToNext}
          onPrevious={goToPrevious}
          total={items.length}
        />
      )}
    </DropImageGalleryContext.Provider>
  );
}

function DropImageGalleryModal({
  activeIndex,
  activeItem,
  canGoNext,
  canGoPrevious,
  onClose,
  onNext,
  onPrevious,
  total,
}: {
  readonly activeIndex: number;
  readonly activeItem: DropImageGalleryItem;
  readonly canGoNext: boolean;
  readonly canGoPrevious: boolean;
  readonly onClose: () => void;
  readonly onNext: () => void;
  readonly onPrevious: () => void;
  readonly total: number;
}) {
  const modalImageRef = useRef<HTMLImageElement>(null);
  const { isCapacitor } = useCapacitor();
  const { downloadMedia, isDownloading, openLabel, openMedia } =
    useMediaActions({
      url: activeItem.src,
      fallbackFileName: "image",
      dialogTitle: "Save image",
      mimeType: "image",
    });

  const handleFullScreen = useCallback(() => {
    const fullscreenTarget = modalImageRef.current;
    if (fullscreenTarget) {
      requestCenteredImageFullscreen(fullscreenTarget);
    }
  }, []);

  return (
    <ImageMediaModal
      src={activeItem.src}
      imageRef={modalImageRef}
      onClose={onClose}
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
        onNext,
        onPrevious,
        total,
      }}
    />
  );
}
