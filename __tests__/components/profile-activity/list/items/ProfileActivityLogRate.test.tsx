import { IdentityActivityContext } from "@/components/profile-activity/IdentityActivityContext";
import ProfileActivityLogRate from "@/components/profile-activity/list/items/ProfileActivityLogRate";
import type { ProfileActivityLogRatingEdit } from "@/entities/IProfile";
import { ProfileActivityLogRatingEditContentChangeReason } from "@/entities/IProfile";
import { RateMatter } from "@/types/enums";
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

it("puts the neutral running total last on Identity reductions and names NIC", () => {
  const log = {
    ...baseLog,
    contents: {
      ...baseLog.contents,
      rating_matter: "CIC" as RateMatter,
      old_rating: 1000,
      new_rating: 560,
    },
  };
  render(
    <IdentityActivityContext value={true}>
      <ProfileActivityLogRate log={log} user={null} />
    </IdentityActivityContext>
  );
  expect(screen.getByText("NIC")).toBeInTheDocument();
  expect(screen.getByText("440")).toHaveClass("tw-text-rose-400");
  expect(screen.getByText("(total 560)")).toHaveClass("tw-text-iron-400");
  expect(
    screen
      .getByText("bob")
      .compareDocumentPosition(screen.getByText("(total 560)")) &
      Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
});
