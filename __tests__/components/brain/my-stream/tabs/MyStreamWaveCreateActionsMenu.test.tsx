import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MyStreamWaveCreateActionsMenu from "@/components/brain/my-stream/tabs/MyStreamWaveCreateActionsMenu";
import { useAuth } from "@/components/auth/Auth";

const createWaveModalMock = jest.fn();

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/components/compact-menu", () => ({
  CompactMenu: (props: any) => (
    <div>
      <button
        className={props.triggerClassName}
        aria-label={props["aria-label"]}
      >
        {props.trigger}
      </button>
      {props.items.map((item: any) => (
        <button key={item.id} onClick={item.onSelect}>
          {item.label}
        </button>
      ))}
    </div>
  ),
}));

jest.mock("@/components/brain/my-stream/MyStreamActionTooltip", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock(
  "@/components/brain/my-stream/tabs/MyStreamWaveCurationCreateDialog",
  () => ({
    __esModule: true,
    default: () => <div data-testid="curation-dialog" />,
  })
);

jest.mock("@/components/waves/create-wave/CreateWaveModal", () => ({
  __esModule: true,
  default: (props: any) => {
    createWaveModalMock(props);
    return props.isOpen ? <div data-testid="subwave-modal" /> : null;
  },
}));

const mockedUseAuth = useAuth as jest.Mock;

const createWave = ({
  eligible = true,
  parentWave = null,
  adminGroupId = "parent-admin-group",
  includeAdminGroup = true,
}: {
  readonly eligible?: boolean;
  readonly parentWave?: object | null;
  readonly adminGroupId?: string | null;
  readonly includeAdminGroup?: boolean;
} = {}) =>
  ({
    id: "parent-wave",
    parent_wave: parentWave,
    chat: { scope: { group: { is_direct_message: false } } },
    wave: {
      authenticated_user_eligible_for_admin: eligible,
      admin_group: includeAdminGroup
        ? {
            group: adminGroupId
              ? { id: adminGroupId, name: "Parent admins", is_hidden: false }
              : null,
          }
        : null,
    },
  }) as any;

describe("MyStreamWaveCreateActionsMenu", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      connectedProfile: { handle: "alice" },
      activeProfileProxy: null,
    });
  });

  it("offers both create actions to an eligible root-wave admin", async () => {
    render(
      <MyStreamWaveCreateActionsMenu
        wave={createWave()}
        onCreated={jest.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: "Open create menu" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New curation" })
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "New subwave" }));

    expect(screen.getByTestId("subwave-modal")).toBeInTheDocument();
    expect(createWaveModalMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        parentWaveId: "parent-wave",
        parentAdminGroupId: "parent-admin-group",
      })
    );
  });

  it.each([
    ["an active proxy", { activeProfileProxy: { id: "proxy" } }, createWave()],
    ["a nested wave", {}, createWave({ parentWave: { id: "root" } })],
    ["no reusable admin group", {}, createWave({ adminGroupId: null })],
    [
      "no admin-group payload",
      {},
      createWave({ includeAdminGroup: false }),
    ],
  ])("hides subwave creation for %s", (_label, authOverride, wave) => {
    mockedUseAuth.mockReturnValue({
      connectedProfile: { handle: "alice" },
      activeProfileProxy: null,
      ...authOverride,
    });

    render(<MyStreamWaveCreateActionsMenu wave={wave} onCreated={jest.fn()} />);

    expect(screen.queryByRole("button", { name: "New subwave" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "New curation" })
    ).toBeInTheDocument();
  });

  it("renders no create control without admin eligibility", () => {
    const { container } = render(
      <MyStreamWaveCreateActionsMenu
        wave={createWave({ eligible: false })}
        onCreated={jest.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("uses a 44px touch target in the mobile tab row", () => {
    render(
      <MyStreamWaveCreateActionsMenu
        wave={createWave()}
        variant="mobile"
        onCreated={jest.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: "Open create menu" })
    ).toHaveClass("tw-size-11");
  });
});
