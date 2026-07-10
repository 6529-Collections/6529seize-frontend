import React from "react";
import { render } from "@testing-library/react";
import WaveGroupTitle from "@/components/waves/specs/groups/group/WaveGroupTitle";
import { WaveGroupType } from "@/components/waves/specs/groups/group/WaveGroup.types";

describe("WaveGroupTitle", () => {
  it("renders label for each type", () => {
    const expectedLabels: Record<WaveGroupType, string> = {
      [WaveGroupType.VIEW]: "View",
      [WaveGroupType.DROP]: "Drop",
      [WaveGroupType.VOTE]: "Vote",
      [WaveGroupType.CHAT]: "Chat access",
      [WaveGroupType.ADMIN]: "Admin",
    };

    Object.values(WaveGroupType).forEach((type) => {
      const { container } = render(
        <WaveGroupTitle type={type as WaveGroupType} />
      );
      expect(container.textContent).toBe(expectedLabels[type as WaveGroupType]);
    });
  });
});
