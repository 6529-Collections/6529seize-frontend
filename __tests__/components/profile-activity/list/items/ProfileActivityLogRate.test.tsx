import ProfileActivityLogRate from "@/components/profile-activity/list/items/ProfileActivityLogRate";
import {
  ProfileActivityLogRatingEdit,
  ProfileActivityLogRatingEditContentChangeReason,
} from "@/entities/IProfile";
import { RateMatter } from "@/enums";
import { render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));
jest.mock(
  "@/components/profile-activity/list/items/utils/ProfileActivityLogItemAction",
  () => (p: any) => <span>{p.action}</span>
);
jest.mock("@/components/user/utils/CommonProfileLink", () => (p: any) => (
  <span>{p.handleOrWallet}</span>
));
jest.mock("@/components/common/SystemAdjustmentPill", () => ({
  SystemAdjustmentPill: () => <span>System Adjustment</span>,
}));

const baseLog: ProfileActivityLogRatingEdit = {
  type: 0 as any,
  timestamp: 0,
  contents: {
    change_reason: ProfileActivityLogRatingEditContentChangeReason.LOST_TDH,
    new_rating: 10,
    old_rating: 5,
    rating_category: "cat",
    rating_matter: RateMatter.REP,
  },
  target_profile_handle: "bob",
  proxy_handle: null,
} as any;

describe("ProfileActivityLogRate", () => {
  it("renders added text and values", () => {
    const log = {
      ...baseLog,
      contents: {
        ...baseLog.contents,
        change_reason: undefined,
        new_rating: 8,
        old_rating: 5,
      },
    } as any;
    render(<ProfileActivityLogRate log={log} user={null} />);
    expect(screen.getByText("added")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("(total 8)")).toBeInTheDocument();
  });

  it("shows system adjustment pill", () => {
    render(<ProfileActivityLogRate log={baseLog} user={null} />);
    expect(screen.getByText("System Adjustment")).toBeInTheDocument();
  });
});
