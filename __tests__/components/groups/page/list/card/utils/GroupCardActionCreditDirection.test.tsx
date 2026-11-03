import { render, fireEvent } from "@testing-library/react";
import GroupCardActionCreditDirection from "@/components/groups/page/list/card/utils/GroupCardActionCreditDirection";
import { CreditDirection } from "@/components/groups/page/list/card/GroupCard";

describe("GroupCardActionCreditDirection", () => {
  it("calls setCreditDirection on clicks", () => {
    const setCreditDirection = jest.fn();
    const { getAllByRole } = render(
      <GroupCardActionCreditDirection
        creditDirection={CreditDirection.ADD}
        setCreditDirection={setCreditDirection}
      />
    );
    const [subtractBtn, addBtn] = getAllByRole("button");
    fireEvent.click(subtractBtn);
    fireEvent.click(addBtn);
    expect(setCreditDirection).toHaveBeenNthCalledWith(
      1,
      CreditDirection.SUBTRACT
    );
    expect(setCreditDirection).toHaveBeenNthCalledWith(2, CreditDirection.ADD);
  });

  it("announces the selected direction in the compact form and preserves its callbacks", () => {
    const setCreditDirection = jest.fn();
    const { getByRole, rerender } = render(
      <GroupCardActionCreditDirection
        compact
        creditDirection={CreditDirection.ADD}
        setCreditDirection={setCreditDirection}
      />
    );
    expect(getByRole("button", { name: "Add" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(getByRole("button", { name: "Subtract" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    fireEvent.click(getByRole("button", { name: "Subtract" }));
    expect(setCreditDirection).toHaveBeenCalledWith(CreditDirection.SUBTRACT);
    rerender(
      <GroupCardActionCreditDirection
        compact
        creditDirection={CreditDirection.SUBTRACT}
        setCreditDirection={setCreditDirection}
      />
    );
    expect(getByRole("button", { name: "Add" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    expect(getByRole("button", { name: "Subtract" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    fireEvent.click(getByRole("button", { name: "Add" }));
    expect(setCreditDirection).toHaveBeenLastCalledWith(CreditDirection.ADD);
  });
});
