import { render, screen } from "@testing-library/react";
import { LevelBadge } from "@/app/api/og-metadata/_lib/profileBadges";
import ProfileLevel, {
  ProfileLevelSize,
} from "@/components/common/profile/ProfileLevel";
import HeaderSearchModalPfp from "@/components/header/header-search/HeaderSearchModalPfp";
import TransferModalPfp from "@/components/nft-transfer/TransferModalPfp";
import UserLevel from "@/components/user/utils/level/UserLevel";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import { CICType } from "@/entities/IProfile";

jest.mock("@/hooks/useResolvedIpfsUrl", () => ({
  useResolvedIpfsUrl: () => ({ data: null }),
}));

// Levels have no top. A level above 100 keeps the color of the highest band
// (80 and up) and shows every digit.
const TOP_COLOR = "#55B075";

describe("level badges above 100", () => {
  it("UserLevel uses the top color and the full level", () => {
    render(<UserLevel level={150} size="xxs" />);

    const badge = screen.getByRole("button", { name: "Level 150" });
    expect(badge).toHaveTextContent("Level 150");
    expect(badge).toHaveClass(`tw-text-[${TOP_COLOR}]`);
  });

  it("UserCICAndLevel uses the top color and the full level", () => {
    render(<UserCICAndLevel level={150} size={UserCICAndLevelSize.COMPACT} />);

    const level = screen.getByText("150");
    expect(level.parentElement).toHaveClass(`tw-text-[${TOP_COLOR}]`);
  });

  it("header search and transfer avatars use the top color", () => {
    render(
      <>
        <HeaderSearchModalPfp level={150} />
        <TransferModalPfp level={160} />
      </>
    );

    expect(screen.getByText("150")).toHaveClass(`tw-bg-[${TOP_COLOR}]`);
    expect(screen.getByText("160")).toHaveClass(`tw-bg-[${TOP_COLOR}]`);
  });

  it("the share image badge uses the top color", () => {
    // Share images render this element with Satori, not the DOM.
    const badge = LevelBadge({ level: 150, size: 38, fontSize: 15 });

    expect(badge.props.style.color).toBe(TOP_COLOR);
    expect(badge.props.children).toBe(150);
  });

  it.each([
    [ProfileLevelSize.SMALL, "tw-h-4", "tw-text-[9px]", "tw-text-[7px]"],
    [ProfileLevelSize.MEDIUM, "tw-h-5", "tw-text-[0.625rem]", "tw-text-[9px]"],
    [ProfileLevelSize.LARGE, "tw-h-6", "tw-text-[0.75rem]", "tw-text-[11.5px]"],
    [ProfileLevelSize.XLARGE, "tw-h-8", "tw-text-[1rem]", "tw-text-[15.5px]"],
  ])(
    "the %s profile badge uses a smaller font for three digits",
    (size, height, twoDigitText, threeDigitText) => {
      render(
        <>
          <ProfileLevel level={99} cicType={CICType.UNKNOWN} size={size} />
          <ProfileLevel level={150} cicType={CICType.UNKNOWN} size={size} />
        </>
      );

      expect(screen.getByText("99")).toHaveClass(height, twoDigitText);
      expect(screen.getByText("150")).toHaveClass(height, threeDigitText);
      expect(screen.getByText("150")).not.toHaveClass(twoDigitText);
    }
  );
});
