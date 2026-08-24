import { render, screen, within } from "@testing-library/react";
import CreateWaveInlineGroupHeader from "@/components/waves/create-wave/groups/CreateWaveInlineGroupHeader";

describe("CreateWaveInlineGroupHeader", () => {
  it("shows member exploration without rendering the generated group name", () => {
    render(
      <CreateWaveInlineGroupHeader
        currentGroupLabel="Randomly generated group name"
        showCurrentGroupTitle={true}
        unsavedGroupDescription={null}
        unsavedGroupSummary={null}
        membersPreview={<button type="button">View members</button>}
      />
    );

    const currentGroup = screen.getByText("Current group").parentElement;
    expect(currentGroup).not.toBeNull();
    expect(
      within(currentGroup!).queryByText("Randomly generated group name")
    ).toBeNull();
    expect(
      within(currentGroup!).getByRole("button", { name: "View members" })
    ).toBeInTheDocument();
  });

  it("keeps the fallback label when there is no member preview", () => {
    render(
      <CreateWaveInlineGroupHeader
        currentGroupLabel="Public"
        showCurrentGroupTitle={false}
        unsavedGroupDescription={null}
        unsavedGroupSummary={null}
      />
    );

    expect(screen.queryByText("Current group")).not.toBeInTheDocument();
    expect(screen.getByText("Public")).toBeInTheDocument();
  });
});
