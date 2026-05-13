import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateDropIdentityPickerContent from "@/components/waves/CreateDropIdentityPickerContent";
import { ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted } from "@/generated/models/ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted";

jest.mock("@/components/utils/input/identity/IdentitySearch", () => ({
  __esModule: true,
  IdentitySearchSize: {
    MD: "MD",
    SM: "SM",
  },
  default: ({
    onSelectionChange,
  }: {
    readonly onSelectionChange?:
      | ((
          selection: {
            readonly value: string;
            readonly label: string;
            readonly secondaryLabel: string;
            readonly avatarUrl: string | null;
            readonly profileId: string;
          } | null
        ) => void)
      | undefined;
  }) => (
    <button
      type="button"
      onClick={() =>
        onSelectionChange?.({
          value: "0xother",
          label: "other",
          secondaryLabel: "0xother",
          avatarUrl: null,
          profileId: "other-id",
        })
      }
    >
      Select mocked identity
    </button>
  ),
}));

describe("CreateDropIdentityPickerContent", () => {
  const renderSubject = ({
    disabled,
    onSelect = jest.fn(),
  }: {
    readonly disabled: boolean;
    readonly onSelect?: jest.Mock;
  }) => {
    render(
      <CreateDropIdentityPickerContent
        mode={ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.Everyone}
        selectedIdentity={null}
        disabled={disabled}
        errorMessage={null}
        onSelect={onSelect}
      />
    );

    return { onSelect };
  };

  it("calls onSelect when IdentitySearch selects an identity while enabled", async () => {
    const { onSelect } = renderSubject({ disabled: false });

    await userEvent.click(screen.getByText("Select mocked identity"));

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        value: "0xother",
        label: "other",
      })
    );
  });

  it("does not call onSelect when IdentitySearch selects an identity while disabled", async () => {
    const { onSelect } = renderSubject({ disabled: true });

    await userEvent.click(screen.getByText("Select mocked identity"));

    expect(onSelect).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        "Identity selection is disabled while the drop is submitting."
      )
    ).toBeInTheDocument();
  });
});
