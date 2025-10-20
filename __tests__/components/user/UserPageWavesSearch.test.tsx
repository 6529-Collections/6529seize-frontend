import UserPageWavesSearch from "@/components/user/waves/UserPageWavesSearch";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(() => ({ isApp: false })),
}));

jest.mock("@/components/utils/button/PrimaryButton", () => ({
  __esModule: true,
  default: ({ onClicked, children }: any) => (
    <button data-testid="primary" onClick={onClicked}>
      {children}
    </button>
  ),
}));

const { default: useDeviceInfo } = require("@/hooks/useDeviceInfo");

describe("UserPageWavesSearch", () => {
  it("updates wave name on input change", async () => {
    const setWaveName = jest.fn();
    render(
      <UserPageWavesSearch
        waveName={""}
        showCreateNewWaveButton={false}
        setWaveName={setWaveName}
      />
    );

    await userEvent.type(screen.getByRole("textbox"), "test");
    expect(setWaveName).toHaveBeenCalled();
    expect(setWaveName.mock.calls[setWaveName.mock.calls.length - 1][0]).toBe(
      "t"
    );
  });

  it("clears wave name when clear icon clicked", async () => {
    const setWaveName = jest.fn();
    render(
      <UserPageWavesSearch
        waveName={"abc"}
        showCreateNewWaveButton={false}
        setWaveName={setWaveName}
      />
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Clear wave name" })
    );
    expect(setWaveName).toHaveBeenLastCalledWith(null);
  });

  it("redirects to create wave page when button clicked", async () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });
    render(
      <UserPageWavesSearch
        waveName={null}
        showCreateNewWaveButton={true}
        setWaveName={jest.fn()}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Create Wave" }));
    expect(push).toHaveBeenCalledWith("/waves?create=wave");
  });

  it("redirects to app create wave page when button clicked", async () => {
    const push = jest.fn();
    (useDeviceInfo as jest.Mock).mockReturnValueOnce({ isApp: true });
    (useRouter as jest.Mock).mockReturnValue({ push });
    render(
      <UserPageWavesSearch
        waveName={null}
        showCreateNewWaveButton={true}
        setWaveName={jest.fn()}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Create Wave" }));
    expect(push).toHaveBeenCalledWith("/waves/create");
  });
});
