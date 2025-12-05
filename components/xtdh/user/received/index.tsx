"use client";

import XtdhReceivedSection from "../../received";
import type { ReactElement } from "react";

export interface UserXtdhReceivedSectionProps {
  readonly profileId: string | null;
}

export default function UserPageXtdhReceived({
  profileId,
}: Readonly<UserXtdhReceivedSectionProps>): ReactElement {
  return <XtdhReceivedSection profileId={profileId} />;
}
