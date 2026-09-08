"use client";

import GroupAssignmentPanel from "@/components/groups/assignment/GroupAssignmentPanel";
import type { CreateWaveGroupInlinePanelProps } from "./useCreateWaveGroupInlinePanel";

type WaveAccessGroupInlinePanelProps = CreateWaveGroupInlinePanelProps & {
  readonly showMakeWavePublic?: boolean;
  readonly onMakeWavePublic?: (() => void) | undefined;
  readonly showMatchWaveAccess?: boolean;
  readonly onMatchWaveAccess?: (() => void) | undefined;
};

export default function CreateWaveGroupInlinePanel(
  props: WaveAccessGroupInlinePanelProps
) {
  return (
    <GroupAssignmentPanel
      {...props}
      showChooseGroup={false}
      isWaveAccessEditor={true}
    />
  );
}
