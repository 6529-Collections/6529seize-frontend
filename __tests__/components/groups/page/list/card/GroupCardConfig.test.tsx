import { render, screen } from "@testing-library/react";
import GroupCardConfig from "@/components/groups/page/list/card/GroupCardConfig";
import { GroupDescriptionType } from "@/entities/IGroup";

describe("GroupCardConfig", () => {
  it("keeps a filter summary on one horizontally scrollable line", () => {
    render(
      <GroupCardConfig
        config={{
          key: GroupDescriptionType.REP,
          value: ">= 50, category: shared experience, from identity: grubnot",
        }}
      />
    );

    expect(screen.getByText("Rep:").parentElement).toHaveClass(
      "tw-flex-shrink-0",
      "tw-whitespace-nowrap"
    );
  });
});
