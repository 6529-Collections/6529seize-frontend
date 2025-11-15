"use client";

import XtdhReceivedSection from "../../received";

export interface UserXtdhReceivedSectionProps {
  readonly profileId: string | null;
}

export default function UserPageXtdhReceived({
  profileId,
}: UserXtdhReceivedSectionProps) {
  return (
    <XtdhReceivedSection
      scope={{ kind: "identity", identity: profileId }}
      description="NFTs from this profile that currently receive xTDH."
    />
  );
}
