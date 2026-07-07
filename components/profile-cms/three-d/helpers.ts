import type { PointerEvent as ReactPointerEvent } from "react";

import type { CmsThreeDViewerConfig } from "@/components/profile-cms/CmsThreeDTypes";
import type {
  CmsThreeDClickable,
  CmsThreeDRuntime,
  LegacyMediaQueryList,
} from "@/components/profile-cms/three-d/types";

export function getCmsThreeDConfigRuntimeKey(
  config: CmsThreeDViewerConfig
): string {
  if (config.kind === "object") {
    return [
      config.kind,
      config.asset.id,
      config.asset.url,
      config.poster?.url ?? "",
      config.requiresActivation,
      config.sourceHref ?? "",
    ].join("|");
  }

  return [
    config.kind,
    config.preset,
    config.poster?.url ?? "",
    config.requiresActivation,
    ...config.placements.map((placement) =>
      [
        placement.id,
        placement.asset.id,
        placement.asset.url,
        placement.detailHref,
        placement.displayMode,
        placement.position?.join(",") ?? "",
        placement.rotation?.join(",") ?? "",
        placement.size?.join(",") ?? "",
      ].join(":")
    ),
  ].join("|");
}

export function addMediaQueryChangeListener(
  query: MediaQueryList | undefined,
  listener: () => void
): () => void {
  if (!query) {
    return () => {};
  }

  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }

  const legacyQuery = query as LegacyMediaQueryList;
  legacyQuery.addListener?.(listener);
  return () => legacyQuery.removeListener?.(listener);
}

export function getSelectedCmsThreeDClickable({
  canvas,
  event,
  runtime,
}: {
  readonly canvas: HTMLCanvasElement;
  readonly event: ReactPointerEvent<HTMLCanvasElement>;
  readonly runtime: CmsThreeDRuntime;
}): CmsThreeDClickable | undefined {
  const rect = canvas.getBoundingClientRect();
  runtime.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  runtime.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  runtime.raycaster.setFromCamera(runtime.pointer, runtime.camera);

  const intersections = runtime.raycaster.intersectObjects(
    runtime.clickable.map((item) => item.object),
    true
  );

  return intersections
    .map((intersection) =>
      runtime.clickable.find(
        (item) =>
          item.object === intersection.object ||
          item.object === intersection.object.parent
      )
    )
    .find((item): item is CmsThreeDClickable => !!item);
}
