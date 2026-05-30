import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
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
