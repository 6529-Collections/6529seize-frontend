import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GroupCardActionFooter from "../../../../../../../components/groups/page/list/card/utils/GroupCardActionFooter";

jest.mock("../../../../../../../components/utils/button/PrimaryButton", () => (props: any) => (
  <button data-testid="save" disabled={props.disabled} onClick={props.onClicked}>Save</button>
));

describe("GroupCardActionFooter", () => {
  it("triggers callbacks", async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    const onCancel = jest.fn();
    render(<GroupCardActionFooter loading={false} disabled={false} onSave={onSave} onCancel={onCancel} />);
    await user.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
    await user.click(screen.getByTestId("save"));
    expect(onSave).toHaveBeenCalled();
  });
});
