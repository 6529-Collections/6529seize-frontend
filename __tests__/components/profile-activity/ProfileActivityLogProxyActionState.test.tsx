import ProfileActivityLogProxyActionState from "@/components/profile-activity/list/items/ProfileActivityLogProxyActionState";
import { AcceptActionRequestActionEnum } from "@/generated/models/AcceptActionRequest";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";
import { ProfileActivityLogType } from "@/types/enums";
import { render, screen } from "@testing-library/react";

jest.mock("@/components/user/utils/CommonProfileLink", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="link" />),
}));
jest.mock("next/navigation", () => ({ useSearchParams: jest.fn() }));

const {
  default: CommonProfileLink,
} = require("@/components/user/utils/CommonProfileLink");
const { useSearchParams } = require("next/navigation");

describe("ProfileActivityLogProxyActionState", () => {
  beforeEach(() => {
    (CommonProfileLink as jest.Mock).mockClear();
  });

  it("renders labels and uses CommonProfileLink", () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams({ user: "Alice" })
    );
    const log: any = {
      type: ProfileActivityLogType.PROXY_ACTION_STATE_CHANGED,
      target_profile_handle: "Alice",
      contents: {
        action_id: "1",
        proxy_id: "p",
        type: ApiProfileProxyActionType.CreateWave,
        state_change_type: AcceptActionRequestActionEnum.Accept,
      },
    };
    render(<ProfileActivityLogProxyActionState log={log} />);
    expect(screen.getByText("proxy")).toBeInTheDocument();
    expect(screen.getByText("accepted")).toBeInTheDocument();
    expect(screen.getByTestId("link")).toBeInTheDocument();
    expect((CommonProfileLink as jest.Mock).mock.calls[0][0]).toMatchObject({
      handleOrWallet: "Alice",
      isCurrentUser: true,
    });
  });
});
