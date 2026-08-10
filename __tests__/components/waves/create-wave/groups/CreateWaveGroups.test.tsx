import { fireEvent, render, screen } from "@testing-library/react";
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
  it("keeps default access controls collapsed until requested", () => {
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
    const disclosure = screen.getByRole("button", {
      name: /Advanced settings/,
    });
    expect(disclosure).toHaveAttribute("aria-expanded", "false");
    expect(disclosure).toHaveTextContent("Anyone can view and participate");
    expect(screen.getAllByTestId("group")[0]).not.toBeVisible();

    fireEvent.click(disclosure);

    expect(disclosure).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByTestId("group")[0]).toBeVisible();
  });

  it("marks customized access and renders the restricted warning", () => {
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
    expect(
      screen.getByRole("button", { name: /Advanced settings/ })
    ).toHaveTextContent("Customized");
  });
});
