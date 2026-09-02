import type { ApiContentModerationReportStatus } from "@/generated/models/ApiContentModerationReportStatus";
import { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";

type Listener = () => void;

const listeners = new Set<Listener>();
const hiddenDropOverrides = new Map<string, boolean>();
const blockedProfileOverrides = new Map<string, boolean>();
const globalDropOverrides = new Map<string, ApiDropModerationStatus>();
const reportStatusOverrides = new Map<
  string,
  ApiContentModerationReportStatus | null
>();

const publish = () => {
  listeners.forEach((listener) => listener());
};

export const subscribeToContentModerationState = (
  listener: Listener
): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const viewerKey = (viewerProfileId: string, targetId: string): string =>
  `${viewerProfileId}:${targetId}`;

export const setDropHiddenOverride = (
  viewerProfileId: string,
  dropId: string,
  hidden: boolean | undefined
) => {
  const key = viewerKey(viewerProfileId, dropId);
  if (hidden === undefined) {
    hiddenDropOverrides.delete(key);
  } else {
    hiddenDropOverrides.set(key, hidden);
  }
  publish();
};

export const getDropHiddenOverride = (
  viewerProfileId: string,
  dropId: string
): boolean | undefined =>
  hiddenDropOverrides.get(viewerKey(viewerProfileId, dropId));

export const setProfileBlockedOverride = (
  viewerProfileId: string,
  profileId: string,
  blocked: boolean | undefined
) => {
  const key = viewerKey(viewerProfileId, profileId);
  if (blocked === undefined) {
    blockedProfileOverrides.delete(key);
  } else {
    blockedProfileOverrides.set(key, blocked);
  }
  publish();
};

export const getProfileBlockedOverride = (
  viewerProfileId: string,
  profileId: string
): boolean | undefined =>
  blockedProfileOverrides.get(viewerKey(viewerProfileId, profileId));

export const setGlobalDropModerationOverride = (
  dropId: string,
  status: ApiDropModerationStatus
) => {
  if (status === ApiDropModerationStatus.Visible) {
    globalDropOverrides.delete(dropId);
  } else {
    globalDropOverrides.set(dropId, status);
  }
  publish();
};

export const getGlobalDropModerationOverride = (
  dropId: string
): ApiDropModerationStatus | undefined => globalDropOverrides.get(dropId);

export const setDropReportStatusOverride = (
  viewerProfileId: string,
  dropId: string,
  status: ApiContentModerationReportStatus | null
) => {
  reportStatusOverrides.set(viewerKey(viewerProfileId, dropId), status);
  publish();
};

export const getDropReportStatusOverride = (
  viewerProfileId: string,
  dropId: string
): ApiContentModerationReportStatus | null | undefined =>
  reportStatusOverrides.get(viewerKey(viewerProfileId, dropId));

const clearContentModerationOverrides = (): boolean => {
  const hadOverrides =
    hiddenDropOverrides.size > 0 ||
    blockedProfileOverrides.size > 0 ||
    globalDropOverrides.size > 0 ||
    reportStatusOverrides.size > 0;
  hiddenDropOverrides.clear();
  blockedProfileOverrides.clear();
  globalDropOverrides.clear();
  reportStatusOverrides.clear();
  return hadOverrides;
};

export const clearContentModerationState = () => {
  if (clearContentModerationOverrides()) {
    publish();
  }
};

export const resetContentModerationStateForTests = () => {
  clearContentModerationOverrides();
  publish();
};
