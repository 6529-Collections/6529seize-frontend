"use client";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { RepDirection } from "./UserPageRep.helpers";
import NicRatingsDialog from "./NicRatingsDialog";
import RepRatingsDialog from "./RepRatingsDialog";

type Props = {
  readonly profile: ApiIdentity;
  readonly matter: "REP" | "NIC";
  readonly direction: RepDirection;
  readonly category?: string | null;
  readonly total?: number | undefined;
  readonly contributorCount?: number | undefined;
  readonly onClose: () => void;
};

export default function ProfileRatingsDialog({ matter, ...props }: Props) {
  return matter === "REP" ? (
    <RepRatingsDialog {...props} />
  ) : (
    <NicRatingsDialog {...props} matter="NIC" />
  );
}
