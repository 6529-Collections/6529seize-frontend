"use client";

import XtdhReceivedSection from "../../received";

export interface UserXtdhReceivedSectionProps {
  readonly profileId: string | null;
}

/**
 * User-scoped wrapper around the shared xTDH received section.
 * Keeps the public contract identical while delegating to the shared module.
 */
export default function UserPageXtdhReceived({
  profileId,
}: UserXtdhReceivedSectionProps) {
  return <XtdhReceivedSection profileId={profileId} />;
}
