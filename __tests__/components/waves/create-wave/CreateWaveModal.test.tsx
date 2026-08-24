import { render } from "@testing-library/react";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import CreateWaveModal from "@/components/waves/create-wave/CreateWaveModal";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

jest.mock("@/components/waves/create-wave/CreateWave", () => ({
  __esModule: true,
  default: () => <div data-testid="create-wave" />,
}));

jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => ({
  __esModule: true,
  default: jest.fn(({ children }) => children),
}));

const mockedDialog = MobileWrapperDialog as jest.Mock;

describe("CreateWaveModal", () => {
  beforeEach(() => {
    mockedDialog.mockClear();
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
});
