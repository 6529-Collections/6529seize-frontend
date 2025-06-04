import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import ProxyCreateActionConfigAllocateRep from "../../../../../../../components/user/proxy/proxy/create-action/config/ProxyCreateActionConfigAllocateRep";

jest.mock("../../../../../../../components/distribution-plan-tool/common/CircleLoader", () => ({
  __esModule: true,
  default: ({ size }: any) => <div data-testid="loader" data-size={size} />,
  CircleLoaderSize: { SMALL: "SMALL" },
}));

describe("ProxyCreateActionConfigAllocateRep", () => {
  it("enables save button and submits value", async () => {
    const onSubmit = jest.fn();
    const onCancel = jest.fn();
    render(
      <ProxyCreateActionConfigAllocateRep endTime={123} submitting={false} onSubmit={onSubmit} onCancel={onCancel} />
    );

    const saveButton = screen.getByRole("button", { name: /save/i });
    expect(saveButton).toBeDisabled();

    const input = screen.getByPlaceholderText("Credit Amount");
    await userEvent.clear(input);
    await userEvent.type(input, "42");
    expect(saveButton).toBeEnabled();

    await userEvent.click(saveButton);
    expect(onSubmit).toHaveBeenCalledWith({
      action_type: 'ALLOCATE_REP',
      end_time: 123,
      credit_amount: 42,
    });
  });

  it("shows loader when submitting and disables cancel", async () => {
    const onSubmit = jest.fn();
    const onCancel = jest.fn();
    render(
      <ProxyCreateActionConfigAllocateRep endTime={null} submitting={true} onSubmit={onSubmit} onCancel={onCancel} />
    );

    expect(screen.getByTestId("loader")).toBeInTheDocument();

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    expect(cancelButton).toBeDisabled();
    await userEvent.click(cancelButton);
    expect(onCancel).not.toHaveBeenCalled();
  });
});
