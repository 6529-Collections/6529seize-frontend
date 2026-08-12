import { render, screen } from "@testing-library/react";
import CreateWaveGroups from "@/components/waves/create-wave/groups/CreateWaveGroups";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { CREATE_WAVE_GROUPS } from "@/helpers/waves/waves.constants";

jest.mock(
  "@/components/waves/create-wave/groups/CreateWaveGroup",
  () => (props: any) => <div data-testid="group">{props.groupType}</div>
);
jest.mock(
  "@/components/waves/create-wave/utils/CreateWaveWarning",
  () => (props: any) => <div data-testid="warning">{props.title}</div>
);

describe("CreateWaveGroups", () => {
  it("shows the default access controls without an extra disclosure", () => {
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
        onInlineGroupCreate={jest.fn()}
        chatEnabled={true}
        adminCanDeleteDrops={true}
        groupsCache={{}}
        setChatEnabled={jest.fn()}
        setDropsAdminCanDelete={jest.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: "Access" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /Advanced settings/ })
    ).toBeNull();
    expect(screen.getAllByTestId("group")).toHaveLength(
      CREATE_WAVE_GROUPS[ApiWaveType.Chat].length
    );
    for (const group of screen.getAllByTestId("group")) {
      expect(group).toBeVisible();
    }
  });

  it("renders the restricted warning alongside the access controls", () => {
    const groups = { admin: "1", canView: "2" } as any;
    render(
      <CreateWaveGroups
        waveName="Test Wave"
        waveType={ApiWaveType.Rank}
        groups={groups}
        onGroupSelect={jest.fn()}
        onInlineGroupCreate={jest.fn()}
        chatEnabled={false}
        adminCanDeleteDrops={false}
        groupsCache={{}}
        setChatEnabled={jest.fn()}
        setDropsAdminCanDelete={jest.fn()}
      />
    );
    expect(screen.getAllByTestId("group")).toHaveLength(
      CREATE_WAVE_GROUPS[ApiWaveType.Rank].length
    );
    expect(screen.getByTestId("warning")).toBeInTheDocument();
  });
});
