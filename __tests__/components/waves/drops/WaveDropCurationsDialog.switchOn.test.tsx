import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import WaveDropCurationsDialog from "@/components/waves/drops/WaveDropCurationsDialog";

let mockMovedToChain = false;
jest.mock("@/hooks/useWavesMovePhase", () => ({
  useWaveMovedToChain: () => mockMovedToChain,
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ setToast: jest.fn() }),
}));
jest.mock("@/hooks/drops/useDropCurations", () => ({
  useDropCurations: () => ({
    data: [],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
}));
jest.mock("@/hooks/drops/useDropCurationMembershipMutation", () => ({
  useDropCurationMembershipMutation: () => ({
    updateMembershipAsync: jest.fn(),
    isPending: false,
    pendingCurationId: null,
  }),
}));
jest.mock(
  "@/components/mobile-wrapper-dialog/MobileWrapperDialog",
  () =>
    function MockDialog({
      isOpen,
      children,
    }: {
      readonly isOpen: boolean;
      readonly children: ReactNode;
    }) {
      return isOpen ? <div role="dialog">{children}</div> : null;
    }
);
jest.mock(
  "@/components/brain/my-stream/tabs/MyStreamWaveCurationCreateDialog",
  () => () => null
);

const LINE = "Curations stay on 6529.io for now.";
const renderDialog = () =>
  render(
    <WaveDropCurationsDialog
      dropId="drop-1"
      wave={{ id: "wave-1", admin_group_id: null } as never}
      isOpen
      onClose={jest.fn()}
    />
  );

describe("WaveDropCurationsDialog after the switch-on", () => {
  afterEach(() => {
    mockMovedToChain = false;
  });

  it("says curations stay on 6529.io, in a wave that moved", () => {
    mockMovedToChain = true;
    renderDialog();
    expect(screen.getByText(LINE)).toBeInTheDocument();
  });

  it("says nothing of the kind anywhere else", () => {
    renderDialog();
    expect(screen.queryByText(LINE)).toBeNull();
  });
});
