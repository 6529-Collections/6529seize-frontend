import React from "react";
import { render, screen } from "@testing-library/react";
import WaveGroup from "@/components/waves/specs/groups/group/WaveGroup";
import { WaveGroupType } from "@/components/waves/specs/groups/group/WaveGroup.types";
import { AuthContext } from "@/components/auth/Auth";

jest.mock("@/components/waves/specs/groups/group/WaveGroupTitle", () => () => (
  <div data-testid="title" />
));
jest.mock(
  "@/components/waves/specs/groups/group/edit/WaveGroupEditButtons",
  () => () => <div data-testid="edit" />
);
jest.mock(
  "@/components/waves/specs/groups/group/WaveGroupScope",
  () =>
    ({ group }: any) =>
      group ? <div data-testid="scope" /> : <span>Public</span>
);
jest.mock(
  "@/components/waves/specs/groups/group/WaveGroupMembersScope",
  () => () => <div data-testid="members-scope" />
);

jest.mock("@/helpers/waves/waves.helpers", () => ({ canEditWave: jest.fn() }));
jest.mock("@/hooks/isMobileDevice", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const canEditWave = require("@/helpers/waves/waves.helpers")
  .canEditWave as jest.Mock;
const useIsMobileDevice = require("@/hooks/isMobileDevice")
  .default as jest.Mock;

const auth = {
  connectedProfile: { handle: "a" },
  activeProfileProxy: null,
} as any;
const wrapper = ({ children }: any) => (
  <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
);

const baseProps = {
  wave: { id: "w1" } as any,
  type: WaveGroupType.VIEW,
  isEligible: true,
};

describe("WaveGroup", () => {
  beforeEach(() => {
    canEditWave.mockReturnValue(true);
    useIsMobileDevice.mockReturnValue(false);
  });

  afterEach(() => jest.clearAllMocks());

  it("shows the gear menu and member summary when the viewer can administer the wave", () => {
    const scope = { group: { is_direct_message: false } } as any;
    const { container } = render(
      <WaveGroup {...baseProps} scope={scope} showMembersSummary />,
      { wrapper }
    );

    expect(screen.getByTestId("edit")).toBeInTheDocument();
    expect(screen.getByTestId("members-scope")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("tw-items-center");
    expect(screen.getByTestId("members-scope").parentElement).toHaveClass(
      "tw-items-center"
    );
  });

  it("hides the gear menu when the viewer cannot administer the wave", () => {
    canEditWave.mockReturnValue(false);
    const scope = { group: { is_direct_message: false } } as any;
    render(<WaveGroup {...baseProps} scope={scope} />, { wrapper });
    expect(screen.queryByTestId("edit")).toBeNull();
  });

  it('shows "Public" when no group provided', () => {
    render(<WaveGroup {...baseProps} scope={{} as any} />, { wrapper });
    expect(screen.getByText("Public")).toBeInTheDocument();
  });

  it('shows "Public" for an empty chat scope', () => {
    render(
      <WaveGroup {...baseProps} type={WaveGroupType.CHAT} scope={{} as any} />,
      { wrapper }
    );

    expect(screen.getByText("Public")).toBeInTheDocument();
  });
});
