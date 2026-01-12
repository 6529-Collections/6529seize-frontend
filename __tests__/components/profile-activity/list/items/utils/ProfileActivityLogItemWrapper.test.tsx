import ProfileActivityLogItemWrapper from "@/components/profile-activity/list/items/utils/ProfileActivityLogItemWrapper";
import { USER_PAGE_TAB_IDS } from "@/components/user/layout/userTabs.config";
import { ProfileActivityLogType, RateMatter } from "@/types/enums";
import { render } from "@testing-library/react";

jest.mock("@/components/user/utils/CommonProfileLink", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="link" />),
}));
const {
  default: CommonProfileLink,
} = require("@/components/user/utils/CommonProfileLink");

describe("ProfileActivityLogItemWrapper", () => {
  beforeEach(() => {
    (CommonProfileLink as jest.Mock).mockClear();
  });

  it("passes props to CommonProfileLink using proxy handle and rep tab", () => {
    const log: any = {
      id: "1",
      type: ProfileActivityLogType.RATING_EDIT,
      proxy_handle: "alice",
      profile_handle: "bob",
      contents: { rating_matter: RateMatter.REP },
    };
    render(
      <table>
        <tbody>
          <ProfileActivityLogItemWrapper log={log} user="alice">
            child
          </ProfileActivityLogItemWrapper>
        </tbody>
      </table>
    );
    expect((CommonProfileLink as jest.Mock).mock.calls[0][0]).toMatchObject({
      handleOrWallet: "alice",
      isCurrentUser: true,
      tabTarget: USER_PAGE_TAB_IDS.REP,
    });
  });

  it("omits profile link when archived", () => {
    const log: any = { id: "1", type: ProfileActivityLogType.PROFILE_ARCHIVED };
    render(
      <table>
        <tbody>
          <ProfileActivityLogItemWrapper log={log} user={null}>
            child
          </ProfileActivityLogItemWrapper>
        </tbody>
      </table>
    );
    expect(CommonProfileLink).not.toHaveBeenCalled();
  });
});
