import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthContext } from "@/components/auth/Auth";
import { createMockAuthContext } from "@/__tests__/utils/testContexts";
import MintingTodayPreview from "@/components/user/subscriptions/coverage/dev/MintingTodayPreview";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";

jest.mock("@/hooks/useNowMinting", () => ({
  useNowMinting: () => ({
    nft: {
      id: 570,
      contract: "0x33fd426905f149f8376e227d0c9d3340aad17af1",
      thumbnail: "/profile-cms/templates/memes/1.webp",
    },
  }),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
  getStructuredApiErrorStatus: jest.fn(),
}));

describe("Minting Today local preview", () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([false, true])(
    "renders a mint day independently of the real date (visitor: %s)",
    async (readonly) => {
      const auth = createMockAuthContext({ requestAuth: jest.fn() });
      render(
        <AuthContext.Provider value={auth}>
          <MintingTodayPreview
            profileKey="preview-profile"
            details={{
              balance: 71.55784,
              automatic: true,
              subscribe_all_editions: true,
              subscription_eligibility_count: 12,
              last_update: 0,
            }}
            memes_subscriptions={[]}
            readonly={readonly}
            refresh={jest.fn()}
          />
        </AuthContext.Provider>
      );
      expect(screen.getByText("The Memes #570")).toBeVisible();
      expect(
        screen.getByRole("button", { name: "Minting Today" })
      ).toBeVisible();
      expect(screen.getByText("Fri, Nov 6, 2026")).toBeVisible();
      expect(screen.getByText("Mon, Nov 9, 2026")).toBeVisible();
      if (readonly) {
        expect(screen.queryByRole("switch")).not.toBeInTheDocument();
        expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
        expect(screen.getAllByText("Subscribed", { exact: true })).toHaveLength(
          3
        );
      } else {
        const locked = screen.getByRole("switch", {
          name: "Toggle subscription for The Memes #570",
        });
        expect(locked).toBeDisabled();
        await userEvent.setup().click(locked);
        expect(auth.requestAuth).not.toHaveBeenCalled();
      }
      expect(commonApiFetch).not.toHaveBeenCalled();
      expect(commonApiPost).not.toHaveBeenCalled();
    }
  );
});
