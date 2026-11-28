import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveInlineGroupDraftSummary from "@/components/waves/create-wave/groups/CreateWaveInlineGroupDraftSummary";

it.each([false, true])(
  "moves the existing Save action and preserves its states (mobile: %s)",
  async (mobilePresentation) => {
    const user = userEvent.setup();
    const footer = document.createElement("div");
    document.body.append(footer);
    const onSave = jest.fn();
    const props = {
      draftSummary: "1 explicitly included user",
      isValid: true,
      canCreateDraft: true,
      isCreating: false,
      forceVisible: true,
      saveChangesLabel: true,
      mobilePresentation,
      privacyControl: (
        <input type="checkbox" aria-label="Hide criteria and members" />
      ),
      actionsContainer: footer,
      onCreateAndUse: onSave,
    };
    const view = render(
      <CreateWaveInlineGroupDraftSummary {...props} actionsContainer={null} />
    );
    try {
      expect(
        screen.queryByRole("button", { name: "Save changes" })
      ).not.toBeInTheDocument();
      view.rerender(<CreateWaveInlineGroupDraftSummary {...props} />);
      expect(within(view.container).getByText("After editing")).toBeVisible();
      expect(
        screen.getAllByRole("button", { name: "Save changes" })
      ).toHaveLength(1);
      expect(
        within(footer).getByRole("button", { name: "Save changes" })
      ).toBeEnabled();
      expect(
        (mobilePresentation
          ? within(view.container)
          : within(footer)
        ).getByRole("checkbox")
      ).toBeVisible();
      await user.click(
        within(footer).getByRole("button", { name: "Save changes" })
      );
      expect(onSave).toHaveBeenCalledTimes(1);
      view.rerender(
        <CreateWaveInlineGroupDraftSummary
          {...props}
          isValid={false}
          canCreateDraft={false}
        />
      );
      expect(screen.getByText("Not ready yet.", { exact: true })).toBeVisible();
      expect(
        within(footer).getByRole("button", { name: "Save changes" })
      ).toBeDisabled();
      view.rerender(
        <CreateWaveInlineGroupDraftSummary {...props} isCreating />
      );
      expect(within(footer).getByRole("button")).toHaveAttribute(
        "aria-busy",
        "true"
      );
      expect(within(footer).getByRole("button")).toBeDisabled();
      expect(onSave).toHaveBeenCalledTimes(1);
    } finally {
      view.unmount();
      footer.remove();
    }
  }
);
