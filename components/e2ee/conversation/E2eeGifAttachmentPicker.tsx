"use client";

import { GifIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { COMPOSER_ACTION_ICON_CLASS_NAME } from "@/components/waves/composerPresentation";
import { createDropGifPickerLoader } from "@/components/waves/CreateDropGifPickerLoader";
import LazyCreateDropGifPicker from "@/components/waves/LazyCreateDropGifPicker";
import { publicEnv } from "@/config/env";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { downloadGiphyGif, GifDownloadError } from "@/lib/e2ee/giphy";
import { E2eeComposerActionButton } from "./E2eeComposerActions";
import type { ComposerError } from "./useE2eeComposerParts";

export function E2eeGifAttachmentPicker({
  onAttach,
  onError,
  onPendingChange,
  compact,
  onAction,
}: {
  readonly onAttach: (file: File) => void;
  readonly onError: (error: ComposerError | null) => void;
  readonly onPendingChange: (pending: boolean) => void;
  readonly compact: boolean;
  readonly onAction: () => void;
}) {
  const locale = useBrowserLocale();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const download = useRef<AbortController | null>(null);
  const attach = useRef(onAttach);
  useEffect(() => {
    attach.current = onAttach;
  }, [onAttach]);
  useEffect(
    () => () => {
      download.current?.abort();
      onPendingChange(false);
    },
    [onPendingChange]
  );
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    globalThis.addEventListener("keydown", close);
    return () => globalThis.removeEventListener("keydown", close);
  }, [open]);

  const cancel = () => {
    download.current?.abort();
    download.current = null;
    setPending(false);
    onPendingChange(false);
  };

  const select = async (url: string) => {
    if (download.current) return;
    const controller = new AbortController();
    download.current = controller;
    setOpen(false);
    setPending(true);
    onPendingChange(true);
    onError(null);
    try {
      const file = await downloadGiphyGif(url, controller.signal);
      if (!controller.signal.aborted) attach.current(file);
    } catch (error) {
      if (!controller.signal.aborted) {
        onError({
          key:
            error instanceof GifDownloadError && error.reason === "tooLarge"
              ? "e2ee.composer.gifTooLarge"
              : "e2ee.composer.gifFailed",
          params: {},
        });
      }
    } finally {
      if (!controller.signal.aborted) {
        download.current = null;
        setPending(false);
        onPendingChange(false);
      }
    }
  };

  const label = t(
    locale,
    pending ? "e2ee.composer.cancelGif" : "waves.gifPicker.open"
  );
  return (
    <>
      <E2eeComposerActionButton
        tooltip={label}
        compactLabel={
          compact ? t(locale, "waves.composer.actions.gif") : undefined
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          onAction();
          if (pending) {
            cancel();
          } else {
            setOpen(true);
          }
        }}
        onMouseEnter={createDropGifPickerLoader.preload}
        onFocus={createDropGifPickerLoader.preload}
      >
        {pending ? (
          <span className="tw-relative tw-flex tw-items-center tw-gap-0.5">
            <CircleLoader />
            <XMarkIcon aria-hidden="true" className="tw-size-3" />
          </span>
        ) : (
          <GifIcon
            aria-hidden="true"
            className={COMPOSER_ACTION_ICON_CLASS_NAME}
          />
        )}
      </E2eeComposerActionButton>
      <LazyCreateDropGifPicker
        giphyApiKey={publicEnv.GIPHY_API_KEY}
        show={open}
        setShow={setOpen}
        onSelect={(url) => void select(url)}
        description={t(locale, "e2ee.composer.gifPrivacy")}
      />
    </>
  );
}
