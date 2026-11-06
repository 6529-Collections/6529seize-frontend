"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DropImageGalleryProvider,
  type LocalGalleryImage,
} from "@/components/drops/view/part/DropImageGalleryProvider";
import type { DropImageGalleryItem } from "@/components/drops/view/part/dropImageGallery";
import type { E2eeAttachment } from "@/lib/e2ee/types";

type RegisterImage = (id: string, image: LocalGalleryImage) => () => void;
const ImageRegistry = createContext<RegisterImage | null>(null);
export const useE2eeImageRegistry = () => useContext(ImageRegistry);

/** Only validated, decoded attachments enter the gallery; it never fetches ciphertext itself. */
export function E2eeImageGallery({
  attachments,
  children,
}: {
  readonly attachments: readonly E2eeAttachment[];
  readonly children: ReactNode;
}) {
  const [images, setImages] = useState<ReadonlyMap<string, LocalGalleryImage>>(
    () => new Map()
  );
  const register = useCallback<RegisterImage>((id, image) => {
    setImages((current) => new Map(current).set(id, image));
    return () =>
      setImages((current) => {
        if (current.get(id) !== image) return current;
        const next = new Map(current);
        next.delete(id);
        return next;
      });
  }, []);
  const items = useMemo(
    () =>
      attachments.flatMap((attachment): DropImageGalleryItem[] => {
        const image = images.get(attachment.blob);
        return image
          ? [{ id: attachment.blob, src: image.src, source: "media" }]
          : [];
      }),
    [attachments, images]
  );
  return (
    <ImageRegistry.Provider value={register}>
      <DropImageGalleryProvider items={items} localImages={images}>
        {children}
      </DropImageGalleryProvider>
    </ImageRegistry.Provider>
  );
}
