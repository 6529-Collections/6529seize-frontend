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

    const currentGroup = screen.getByText("Before editing").parentElement;
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

    expect(screen.queryByText("Before editing")).not.toBeInTheDocument();
    expect(screen.getByText("Public")).toBeInTheDocument();
  });

  it("says when a group made on the 6529 Network still has its placeholder name", () => {
    render(
      <CreateWaveInlineGroupHeader
        currentGroupLabel="Group 0xab12ab12"
        currentGroupNamePending
        showCurrentGroupTitle={false}
        unsavedGroupDescription={null}
        unsavedGroupSummary={null}
      />
    );

    expect(
      screen.getByText(
        "This group's name shows here once 6529.io has read it from the 6529 Network."
      )
    ).toBeInTheDocument();
  });
});
