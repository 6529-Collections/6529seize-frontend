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

  it("uses quieter type only when requested", () => {
    const config = {
      key: GroupDescriptionType.REP,
      value: ">= 50, category: shared experience",
    };
    const { rerender } = render(<GroupCardConfig config={config} quiet />);

    expect(screen.getByText("Rep:").parentElement).toHaveClass(
      "tw-font-normal",
      "tw-text-iron-300"
    );
    expect(screen.getByText(config.value)).toHaveClass(
      "tw-font-medium",
      "tw-text-iron-200"
    );

    rerender(<GroupCardConfig config={config} />);
    expect(screen.getByText("Rep:").parentElement).toHaveClass(
      "tw-font-medium",
      "tw-text-iron-200"
    );
    expect(screen.getByText(config.value)).toHaveClass(
      "tw-font-semibold",
      "tw-text-iron-50"
    );
  });
});
