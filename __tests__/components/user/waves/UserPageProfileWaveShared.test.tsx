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
      onOpenWave={jest.fn()}
      {...props}
    />
  );

describe("OfficialWaveSummary", () => {
  it("renders Add post in the owner controls when provided", () => {
    const onAddPost = jest.fn();

    renderSummary({ onAddPost });

    fireEvent.click(screen.getByRole("button", { name: "Add post" }));

    expect(onAddPost).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole("button", { name: "Add post" })).toHaveLength(1);
  });

  it("keeps Manage and Add post together in the owner controls", () => {
    renderSummary({
      onAddPost: jest.fn(),
      manageCurationControl: <button type="button">Manage</button>,
    });

    const manageButton = screen.getByRole("button", { name: "Manage" });
    const addPostButton = screen.getByRole("button", { name: "Add post" });

    expect(manageButton.parentElement).toBe(addPostButton.parentElement);
  });

  it("leads with the Curation name and keeps the source Wave contextual", () => {
    renderSummary();

    expect(screen.getByRole("heading", { name: "Art" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open source Wave Daily" })
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
