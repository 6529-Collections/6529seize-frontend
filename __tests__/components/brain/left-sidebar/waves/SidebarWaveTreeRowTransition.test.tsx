import { render, screen } from "@testing-library/react";
import { createMockMinimalWave } from "@/__tests__/utils/mockFactories";
import { SidebarWaveTreeRowTransition } from "@/components/brain/left-sidebar/waves/SidebarWaveTreeRowTransition";
import type { AnimatedSidebarWaveTreeRow } from "@/hooks/useAnimatedSidebarWaveRows";

const createAnimatedRow = (
  animationState: AnimatedSidebarWaveTreeRow["animationState"]
): AnimatedSidebarWaveTreeRow => ({
  animationState,
  canExpand: false,
  depth: 1,
  hasUnreadSubwaves: false,
  isExpanded: false,
  isFirstSubwave: false,
  isLastSubwave: false,
  isLoadingSubwaves: false,
  key: "parent:child",
  knownSubwavesCount: null,
  parentWaveId: "parent",
  rowType: "wave",
  unreadSubwaveDropsCount: 0,
  wave: createMockMinimalWave({
    id: "child",
    parentWaveId: "parent",
  }),
});

describe("SidebarWaveTreeRowTransition", () => {
  it("clips child rows while animating", () => {
    render(
      <SidebarWaveTreeRowTransition
        row={createAnimatedRow("entering")}
        rowHeight={48}
      >
        <span>Child row</span>
      </SidebarWaveTreeRowTransition>
    );

    expect(screen.getByText("Child row").parentElement).toHaveClass(
      "tw-overflow-hidden"
    );
  });

  it("does not clip entered child rows so connector segments can overlap", () => {
    render(
      <SidebarWaveTreeRowTransition
        row={createAnimatedRow("entered")}
        rowHeight={48}
      >
        <span>Child row</span>
      </SidebarWaveTreeRowTransition>
    );

    expect(screen.getByText("Child row").parentElement).not.toHaveClass(
      "tw-overflow-hidden"
    );
  });
});
