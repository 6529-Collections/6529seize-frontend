import React from "react";
import { render, screen } from "@testing-library/react";
import CreateDropIdentityField from "@/components/waves/CreateDropIdentityField";
import { ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted } from "@/generated/models/ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img alt={props.alt ?? ""} {...props} />
  ),
}));

const selfIdentity = {
  value: "0xviewer",
  label: "viewer",
  secondaryLabel: "0xviewer",
  avatarUrl: null,
  profileId: "viewer-id",
};

describe("CreateDropIdentityField", () => {
  it("shows the viewer identity as a read-only selection in OnlyMyself mode", () => {
    render(
      <CreateDropIdentityField
        mode={
          ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyMyself
        }
        selectedIdentity={null}
        selfIdentity={selfIdentity}
        disabled={false}
        errorMessage={null}
        onOpenPicker={jest.fn()}
      />
    );

    expect(
      screen.getByText("Add content below to submit this drop.")
    ).toBeInTheDocument();
    expect(screen.getByText("viewer")).toBeInTheDocument();
    expect(screen.getByText("0xviewer")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /change identity/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /select identity/i })
    ).not.toBeInTheDocument();
  });

  it("shows an unavailable read-only state in OnlyMyself mode when the viewer identity is missing", () => {
    render(
      <CreateDropIdentityField
        mode={
          ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyMyself
        }
        selectedIdentity={null}
        selfIdentity={null}
        disabled={false}
        errorMessage="We couldn't determine your identity for this submission."
        onOpenPicker={jest.fn()}
      />
    );

    expect(screen.getByText("Identity unavailable")).toBeInTheDocument();
    expect(
      screen.getByText(
        "We couldn't determine your identity for this submission."
      )
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
