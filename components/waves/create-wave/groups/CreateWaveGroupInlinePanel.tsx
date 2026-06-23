"use client";

import GroupAssignmentPanel from "@/components/groups/assignment/GroupAssignmentPanel";
import type { CreateWaveGroupInlinePanelProps } from "./useCreateWaveGroupInlinePanel";

export default function CreateWaveGroupInlinePanel(
  props: CreateWaveGroupInlinePanelProps
) {
  return <GroupAssignmentPanel {...props} layout="inline" />;
}
