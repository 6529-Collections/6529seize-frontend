"use client";

import XtdhReceivedSection from "../../received";

export interface UserXtdhReceivedSectionProps {
  readonly profileId: string | null;
}

export default function UserPageXtdhReceived({
  profileId: _profileId,
}: UserXtdhReceivedSectionProps) {
  return <XtdhReceivedSection />;
}
