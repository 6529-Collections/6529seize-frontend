import React from "react";
import { render, screen } from "@testing-library/react";
import GroupCreateHeader from "@/components/groups/page/create/GroupCreateHeader";

describe("GroupCreateHeader", () => {
  it("renders icon and label with expected classes", () => {
    const { container } = render(<GroupCreateHeader />);
    const outer = container.firstElementChild as HTMLElement;
    expect(outer).toHaveClass("tw-inline-flex");
    expect(outer).toHaveClass("tw-items-center");

    const icon = outer.querySelector("svg");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("tw-size-5");
    expect(icon).not.toHaveClass("sm:tw-size-6");
    expect(icon?.parentElement).toHaveClass("tw-size-9");
    expect(icon?.parentElement).toHaveClass("tw-rounded-lg");
    expect(screen.getByText("Group configuration")).toHaveClass("tw-m-0");
  });
});
