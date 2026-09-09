import { AuthContext } from "@/components/auth/Auth";
import UserSettingsBannerImageInput from "@/components/user/settings/UserSettingsBannerImageInput";
import { createMockAuthContext } from "@/__tests__/utils/testContexts";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("UserSettingsBannerImageInput", () => {
  it("announces and associates an invalid file-size message", async () => {
    const setFile = jest.fn();
    render(
      <AuthContext.Provider
        value={createMockAuthContext({ setToast: jest.fn() })}
      >
        <UserSettingsBannerImageInput imageToShow={null} setFile={setFile} />
      </AuthContext.Provider>
    );

    const input = screen.getByLabelText("Upload profile cover");

    const file = new File(["content"], "cover.png", { type: "image/png" });
    Object.defineProperty(file, "size", { value: 3_000_000 });
    await userEvent.upload(input, file);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "File size must be less than 2MB"
    );
    expect(input).toHaveAttribute("aria-describedby", "banner-upload-error");
    expect(setFile).not.toHaveBeenCalled();
  });
});
