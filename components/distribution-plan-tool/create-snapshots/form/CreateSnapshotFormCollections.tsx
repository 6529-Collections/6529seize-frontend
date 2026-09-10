"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { MEMES_CONTRACT } from "@/constants/constants";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import Image from "next/image";
import { useId, useRef, useState } from "react";
import CreateSnapshotFormSearchCollectionMemesModal from "./CreateSnapshotFormSearchCollectionMemesModal";
import {
  MEMES_SNAPSHOT_COLLECTION_NAME,
  SNAPSHOT_COLLECTIONS,
  type SnapshotCollectionSelection,
} from "./snapshot-collections";

export default function CreateSnapshotFormCollections({
  selectedCollectionId,
  loadingCollectionId,
  hasCollectionError,
  setCollection,
  onSelectionStart,
}: {
  readonly selectedCollectionId: string | null;
  readonly loadingCollectionId: string | null;
  readonly hasCollectionError: boolean;
  readonly setCollection: (collection: SnapshotCollectionSelection) => void;
  readonly onSelectionStart: () => void;
}) {
  const locale = useBrowserLocale();
  const headingId = useId();
  const memesButtonRef = useRef<HTMLButtonElement>(null);
  const [isOnMemesCollection, setIsOnMemesCollection] = useState(false);

  return (
    <section aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100"
      >
        {t(locale, "emma.snapshots.collections")}
      </h2>
      <ul className="tw-m-0 tw-mt-3 tw-grid tw-list-none tw-gap-2 tw-p-0">
        {SNAPSHOT_COLLECTIONS.map((collection) => (
          <li key={collection.id}>
            <button
              type="button"
              ref={
                collection.address === MEMES_CONTRACT.toLowerCase()
                  ? memesButtonRef
                  : undefined
              }
              aria-pressed={selectedCollectionId === collection.id}
              aria-busy={loadingCollectionId === collection.id}
              onClick={() => {
                onSelectionStart();
                if (collection.address === MEMES_CONTRACT.toLowerCase()) {
                  setIsOnMemesCollection(true);
                } else {
                  setCollection({ ...collection, tokenIds: null });
                }
              }}
              className="tw-flex tw-min-h-14 tw-w-full tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-px-3 tw-py-2 tw-text-left aria-pressed:tw-border-primary-400 aria-pressed:tw-bg-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-iron-700"
            >
              <Image
                unoptimized
                src={collection.imageUrl}
                alt=""
                width={32}
                height={32}
                className="tw-size-8 tw-shrink-0 tw-rounded-md tw-bg-iron-700 tw-object-cover"
              />
              <span className="tw-min-w-0 tw-flex-1 tw-text-sm tw-font-medium tw-text-iron-100">
                {collection.name}
              </span>
              <span className="tw-shrink-0 tw-text-xs tw-text-iron-300">
                {collection.tokenType}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {loadingCollectionId && (
        <output className="tw-mb-0 tw-mt-2 tw-block tw-text-sm tw-text-iron-300">
          {t(locale, "emma.snapshots.loadingTokens")}
        </output>
      )}
      {hasCollectionError && (
        <p role="alert" className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-error">
          {t(locale, "emma.snapshots.tokenIdsError")}
        </p>
      )}
      <MobileWrapperDialog
        isOpen={isOnMemesCollection}
        onClose={() => setIsOnMemesCollection(false)}
        onAfterLeave={() => memesButtonRef.current?.focus()}
        title={t(locale, "emma.snapshots.seasonsTitle", {
          collectionName: MEMES_SNAPSHOT_COLLECTION_NAME,
        })}
        tabletModal
        maxWidthClass="md:tw-max-w-2xl"
        noPadding
      >
        {isOnMemesCollection && (
          <CreateSnapshotFormSearchCollectionMemesModal
            collectionName={MEMES_SNAPSHOT_COLLECTION_NAME}
            onMemesCollection={(collection) => {
              setCollection({
                ...collection,
                id: MEMES_CONTRACT.toLowerCase(),
              });
              setIsOnMemesCollection(false);
            }}
          />
        )}
      </MobileWrapperDialog>
    </section>
  );
}
