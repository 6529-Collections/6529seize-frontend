import { render } from "@testing-library/react";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import CreateWaveModal from "@/components/waves/create-wave/CreateWaveModal";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import CreateWave from "@/components/waves/create-wave/CreateWave";
import CreateWaveProfileRequiredModal from "@/components/waves/create-wave/CreateWaveProfileRequiredModal";

jest.mock(
  "@/components/waves/create-wave/CreateWaveProfileRequiredModal",
  () => ({ __esModule: true, default: jest.fn(() => null) })
);

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

jest.mock("@/components/waves/create-wave/CreateWave", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="create-wave" />),
}));

jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => ({
  __esModule: true,
  default: jest.fn(({ children }) => children),
}));

const mockedDialog = MobileWrapperDialog as jest.Mock;

describe("CreateWaveModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes the parent access group to the creation form", () => {
    render(
      <CreateWaveModal
        isOpen={true}
        onClose={jest.fn()}
        profile={{ handle: "alice" } as ApiIdentity}
        parentWaveId="parent-wave"
        parentWaveName="Parent Wave"
        parentAdminGroupId="parent-admin-group"
        parentViewGroupId="parent-view-group"
      />
    );

    expect(mockedDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Create subwave of "Parent Wave"',
        preserveFocusOnEscape: true,
      }),
      undefined
    );
    expect(CreateWave).toHaveBeenCalledWith(
      expect.objectContaining({
        parentWaveId: "parent-wave",
        parentWaveName: "Parent Wave",
        parentAdminGroupId: "parent-admin-group",
        parentViewGroupId: "parent-view-group",
      }),
      undefined
    );
  });

  it("uses a fixed app-like height with a desktop cap", () => {
    render(
      <CreateWaveModal
        isOpen={true}
        onClose={jest.fn()}
        profile={{ handle: "alice" } as ApiIdentity}
      />
    );

    const dialogProps = mockedDialog.mock.calls[0]?.[0] as {
      readonly fixedHeight?: boolean;
      readonly tall?: boolean;
      readonly surfaceClassName?: string;
    };

    expect(dialogProps.fixedHeight).toBe(true);
    expect(dialogProps.tall).toBe(true);
    expect(dialogProps.surfaceClassName).toContain("md:tw-max-h-[56rem]");
  });

  it("returns profile setup to the originating parent wave", () => {
    const parentId = "00000000-0000-4000-8000-000000000529";
    render(
      <CreateWaveModal
        isOpen
        onClose={jest.fn()}
        profile={{ handle: null, primary_wallet: "0x529" } as ApiIdentity}
        parentWaveId={parentId}
      />
    );
    expect(CreateWaveProfileRequiredModal).toHaveBeenCalledWith(
      expect.objectContaining({ returnTo: `/waves/${parentId}` }),
      undefined
    );
    expect(CreateWave).not.toHaveBeenCalled();
  });
});
