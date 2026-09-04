import { fireEvent, render, screen } from "@testing-library/react";
import CreateWaveGroups from "@/components/waves/create-wave/groups/CreateWaveGroups";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { CREATE_WAVE_GROUPS } from "@/helpers/waves/waves.constants";
import { ApiWaveGroupRole } from "@/generated/models/ApiWaveGroupRole";

jest.mock(
  "@/components/waves/create-wave/groups/CreateWaveGroup",
  () => (props: any) => (
    <div data-error={props.errorMessage ?? ""} data-testid="group">
      {props.groupType}
      <button onClick={() => props.onCriteriaReplacementChange(true)}>
        edit {props.groupType}
      </button>
    </div>
  )
);
describe("CreateWaveGroups", () => {
  it("shows only the main access control until permissions are expanded", () => {
    render(
      <CreateWaveGroups
        waveName="Test Wave"
        waveType={ApiWaveType.Chat}
        groups={{
          admin: null,
          canView: null,
          canDrop: null,
          canVote: null,
          canChat: null,
        }}
        onGroupSelect={jest.fn()}
        onCriteriaReplacementChange={jest.fn()}
        onGroupResolutionChange={jest.fn()}
        onInlineGroupCreate={jest.fn()}
        chatEnabled={true}
        adminCanDeleteDrops={true}
        groupsCache={{}}
        invalidRoles={[]}
        isValidating={false}
        validationUnavailable={false}
        setChatEnabled={jest.fn()}
        setDropsAdminCanDelete={jest.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: "Access" })).toBeVisible();
    expect(
      screen.getByText(
        "By default, everyone with access can participate. Only you can administer the wave."
      )
    ).toBeVisible();
    const permissionsButton = screen.getByRole("button", {
      name: "Customize permissions",
    });
    expect(permissionsButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.getAllByTestId("group")).toHaveLength(
      CREATE_WAVE_GROUPS[ApiWaveType.Chat].length
    );
    expect(screen.getAllByTestId("group")[0]).toBeVisible();
    expect(screen.getAllByTestId("group")[1]).not.toBeVisible();
    expect(screen.getAllByTestId("group")[2]).not.toBeVisible();

    fireEvent.click(permissionsButton);

    expect(permissionsButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByTestId("group")[1]).toBeVisible();
    expect(screen.getAllByTestId("group")[2]).toBeVisible();
  });

  it("does not render the limited access warning for restricted groups", () => {
    const groups = { admin: "1", canView: "2" } as any;
    render(
      <CreateWaveGroups
        waveName="Test Wave"
        waveType={ApiWaveType.Rank}
        groups={groups}
        onGroupSelect={jest.fn()}
        onCriteriaReplacementChange={jest.fn()}
        onGroupResolutionChange={jest.fn()}
        onInlineGroupCreate={jest.fn()}
        chatEnabled={false}
        adminCanDeleteDrops={false}
        groupsCache={{}}
        invalidRoles={[]}
        isValidating={false}
        validationUnavailable={false}
        setChatEnabled={jest.fn()}
        setDropsAdminCanDelete={jest.fn()}
      />
    );
    expect(screen.getAllByTestId("group")).toHaveLength(
      CREATE_WAVE_GROUPS[ApiWaveType.Rank].length
    );
    expect(
      screen.queryByText("Warning: Limited Access")
    ).not.toBeInTheDocument();
  });

  it("identifies incompatible roles and announces validation state", () => {
    render(
      <CreateWaveGroups
        waveName="Test Wave"
        waveType={ApiWaveType.Rank}
        groups={{
          admin: "admin-group",
          canView: "view-group",
          canDrop: "drop-group",
          canVote: null,
          canChat: null,
        }}
        onGroupSelect={jest.fn()}
        onCriteriaReplacementChange={jest.fn()}
        onGroupResolutionChange={jest.fn()}
        onInlineGroupCreate={jest.fn()}
        chatEnabled={true}
        adminCanDeleteDrops={true}
        groupsCache={{}}
        invalidRoles={[ApiWaveGroupRole.Participation]}
        isValidating={false}
        validationUnavailable={true}
        setChatEnabled={jest.fn()}
        setDropsAdminCanDelete={jest.fn()}
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Group access could not be verified"
    );
    expect(
      screen
        .getAllByTestId("group")
        .find((row) => row.textContent?.startsWith("CAN_DROP"))
    ).toHaveAttribute("data-error", expect.stringContaining("Who can drop"));
    expect(
      screen.getByRole("button", { name: /^Customize permissions/ })
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("reports which access role has an open criteria replacement", () => {
    const onCriteriaReplacementChange = jest.fn();
    render(
      <CreateWaveGroups
        waveName="Test Wave"
        waveType={ApiWaveType.Chat}
        groups={{
          admin: null,
          canView: null,
          canDrop: null,
          canVote: null,
          canChat: null,
        }}
        onGroupSelect={jest.fn()}
        onCriteriaReplacementChange={onCriteriaReplacementChange}
        onGroupResolutionChange={jest.fn()}
        onInlineGroupCreate={jest.fn()}
        chatEnabled={true}
        adminCanDeleteDrops={true}
        groupsCache={{}}
        invalidRoles={[]}
        isValidating={false}
        validationUnavailable={false}
        setChatEnabled={jest.fn()}
        setDropsAdminCanDelete={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "edit CAN_VIEW" }));

    expect(onCriteriaReplacementChange).toHaveBeenCalledWith("CAN_VIEW", true);
  });
});
