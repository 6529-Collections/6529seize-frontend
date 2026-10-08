import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GroupCardActionFooter from "@/components/groups/page/list/card/utils/GroupCardActionFooter";

describe("GroupCardActionFooter", () => {
  it("triggers callbacks", async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    const onCancel = jest.fn();
    render(
      <GroupCardActionFooter
        loading={false}
        disabled={false}
        onSave={onSave}
        onCancel={onCancel}
      />
    );
    await user.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Grant" }));
    expect(onSave).toHaveBeenCalled();
  });

  it("keeps compact actions disabled during submission and restores cancellation afterward", async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    const onCancel = jest.fn();
    const props = { compact: true, onSave, onCancel, disabled: true };
    const { rerender } = render(
      <GroupCardActionFooter {...props} loading>
        <span>Available credit</span>
      </GroupCardActionFooter>
    );
    expect(screen.getByText("Available credit")).toBeVisible();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Grant/ })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).not.toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
    rerender(<GroupCardActionFooter {...props} loading={false} />);
    expect(screen.getByRole("button", { name: "Grant" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
