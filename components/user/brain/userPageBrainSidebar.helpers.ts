import type { ApiIdentity } from "@/generated/models/ApiIdentity";

export const getProfileWaveIdentity = (profile: ApiIdentity): string =>
  profile.handle ?? profile.query ?? profile.primary_wallet;

export const keepFocusedSidebarControlVisible = (
  element: HTMLElement
): void => {
  const scrollRegion = element.closest<HTMLElement>(
    "[data-brain-sidebar-scroll-region]"
  );
  if (!scrollRegion) {
    element.scrollIntoView({ block: "nearest", inline: "nearest" });
    return;
  }

  const elementRect = element.getBoundingClientRect();
  const scrollRegionRect = scrollRegion.getBoundingClientRect();

  if (elementRect.top < scrollRegionRect.top) {
    scrollRegion.scrollTop -= scrollRegionRect.top - elementRect.top;
  } else if (elementRect.bottom > scrollRegionRect.bottom) {
    scrollRegion.scrollTop += elementRect.bottom - scrollRegionRect.bottom;
  }
};
