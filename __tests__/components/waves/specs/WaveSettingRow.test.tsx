import { render, screen } from "@testing-library/react";
import WaveSettingRow from "@/components/waves/specs/WaveSettingRow";

jest.mock("@heroicons/react/24/outline", () => ({
  Cog6ToothIcon: () => <svg data-testid="gear-icon" />,
}));

const renderRow = (canEdit: boolean) =>
  render(
    <WaveSettingRow
      canEdit={canEdit}
      editIcon="gear"
      editLabel="Edit links"
      label="Links"
      onOpen={jest.fn()}
      renderEditor={() => <div>Links editor</div>}
      valueLabel="Allowed"
    />
  );

const renderContent = (canEdit: boolean) =>
  render(
    <WaveSettingRow
      canEdit={canEdit}
      editIcon="gear"
      editLabel="Edit guidelines"
      label="Guidelines"
      onOpen={jest.fn()}
      renderEditor={() => <div>Guidelines editor</div>}
      valueLabel="Keep submissions original."
      variant="content"
    />
  );

describe("WaveSettingRow", () => {
  it("shows an accessible gear when the viewer can edit", () => {
    renderRow(true);

    expect(screen.getByRole("button", { name: "Edit links" })).toBeVisible();
    expect(screen.getByTestId("gear-icon")).toBeInTheDocument();
  });

  it("does not render a gear when the viewer cannot edit", () => {
    renderRow(false);

    expect(
      screen.queryByRole("button", { name: "Edit links" })
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("gear-icon")).not.toBeInTheDocument();
  });

  it("renders full content with an admin gear in the content variant", () => {
    renderContent(true);

    expect(
      screen.getByRole("heading", { name: "Guidelines" })
    ).toBeInTheDocument();
    expect(screen.getByText("Keep submissions original.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Edit guidelines" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("gear-icon")).toBeInTheDocument();
  });

  it("keeps content visible without a gear for non-admins", () => {
    renderContent(false);

    expect(screen.getByText("Keep submissions original.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit guidelines" })
    ).not.toBeInTheDocument();
  });
});
