import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { OfficialWaveSummary } from "@/components/user/waves/UserPageProfileWaveShared";

const renderSummary = (
  props: Partial<React.ComponentProps<typeof OfficialWaveSummary>> = {}
) =>
  render(
    <OfficialWaveSummary
      waveName="Daily"
      metadataLabel="10 posts • 4 joined"
      profileCurationLabel="Art"
      canManageOwnOfficialWave={true}
      isChangeWaveOpen={false}
      isRemoving={false}
      onOpenWave={jest.fn()}
      onOpenChangeWave={jest.fn()}
      onRemoveWave={jest.fn()}
      {...props}
    />
  );

describe("OfficialWaveSummary", () => {
  it("renders Add post in the owner controls when provided", () => {
    const onAddPost = jest.fn();

    renderSummary({ onAddPost });

    fireEvent.click(screen.getByRole("button", { name: "Add post" }));

    expect(onAddPost).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: "Switch wave" })
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Add post" })).toHaveLength(
      1
    );
  });

  it("keeps switch curation controls in one controls group", () => {
    renderSummary({
      onAddPost: jest.fn(),
      onOpenChangeCuration: jest.fn(),
      showChangeCuration: true,
    });

    const controls = screen.getByRole("group", {
      name: "Profile wave switch controls",
    });

    expect(controls).toHaveClass("tw-border-0", "tw-p-0");
    expect(
      within(controls).getByRole("button", { name: "Switch wave" })
    ).toBeInTheDocument();
    expect(
      within(controls).getByRole("button", { name: "Switch curation" })
    ).toBeInTheDocument();
    expect(
      within(controls).getByRole("button", { name: "Unset featured wave" })
    ).toBeInTheDocument();
  });

  it("does not render Add post for non-manageable profile waves", () => {
    renderSummary({
      canManageOwnOfficialWave: false,
      onAddPost: jest.fn(),
    });

    expect(
      screen.queryByRole("button", { name: "Add post" })
    ).not.toBeInTheDocument();
  });
});
