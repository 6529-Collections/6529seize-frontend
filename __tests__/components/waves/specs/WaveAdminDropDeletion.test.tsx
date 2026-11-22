import { fireEvent, render, screen } from "@testing-library/react";
import WaveAdminDropDeletion from "@/components/waves/specs/WaveAdminDropDeletion";
import { useWaveSettingUpdater } from "@/components/waves/specs/useWaveSettingUpdater";
import type { ApiWave } from "@/generated/models/ApiWave";

jest.mock("@/components/waves/specs/useWaveSettingUpdater", () => ({
  useWaveSettingUpdater: jest.fn(),
}));

const useWaveSettingUpdaterMock = useWaveSettingUpdater as jest.Mock;

const makeWave = (enabled: boolean): ApiWave =>
  ({ wave: { admin_drop_deletion_enabled: enabled } }) as ApiWave;

const mockUpdater = (canEdit: boolean) => {
  const saveAdminDropDeletion = jest.fn();
  useWaveSettingUpdaterMock.mockReturnValue({
    canEdit,
    mutating: false,
    saveChatUpdate: jest.fn(),
    saveAdminDropDeletion,
    setToast: jest.fn(),
  } satisfies ReturnType<typeof useWaveSettingUpdater>);
  return saveAdminDropDeletion;
};

afterEach(() => jest.clearAllMocks());

describe("WaveAdminDropDeletion", () => {
  it("lets a wave admin turn admin post deletion on", () => {
    const save = mockUpdater(true);
    render(<WaveAdminDropDeletion wave={makeWave(false)} />);

    expect(screen.getByText("Admins can delete posts")).toBeInTheDocument();
    expect(screen.getByText("Off")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Edit admin post deletion" })
    );
    const checkbox = screen.getByRole("checkbox", {
      name: "Allow admins to delete posts",
    });
    expect(checkbox).not.toBeChecked();
    expect(checkbox).toHaveAccessibleDescription(
      /the wave creator and admins can delete anyone's post/
    );
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(save).toHaveBeenCalledWith(expect.any(Function), true);
  });

  it("shows the current value without an edit control to other viewers", () => {
    mockUpdater(false);
    render(<WaveAdminDropDeletion wave={makeWave(true)} />);

    expect(screen.getByText("On")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit admin post deletion" })
    ).not.toBeInTheDocument();
  });
});
