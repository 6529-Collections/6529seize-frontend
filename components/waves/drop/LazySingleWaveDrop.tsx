"use client";

import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import type { SingleWaveDropProps } from "@/components/waves/drops/participation/participationRenderer.types";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

import { singleWaveDropLoader } from "./singleWaveDropLoader";

const LoadedSingleWaveDrop = singleWaveDropLoader.Loaded;

// Fills the panel the single drop view will occupy, so nothing moves when the
// view replaces it. Escape is left to the surface that owns the panel.
function SingleWaveDropPlaceholder() {
  const locale = useBrowserLocale();

  return (
    <div
      role="status"
      aria-busy="true"
      className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-bg-iron-950"
    >
      <CircleLoader size={CircleLoaderSize.XLARGE} />
      <span className="tw-sr-only">{t(locale, "singleDrop.loading")}</span>
    </div>
  );
}

// The single drop view carries the chat composer, so a surface that only
// sometimes opens it loads it on demand instead of with the page. A chunk that
// is already cached renders in the same commit as the open. A chunk that fails
// to load closes the panel so the user can open the drop again.
export default function LazySingleWaveDrop(
  props: Readonly<SingleWaveDropProps>
) {
  const isReady = singleWaveDropLoader.useIsReady({ onError: props.onClose });

  if (!isReady) {
    return <SingleWaveDropPlaceholder />;
  }

  return <LoadedSingleWaveDrop {...props} />;
}
