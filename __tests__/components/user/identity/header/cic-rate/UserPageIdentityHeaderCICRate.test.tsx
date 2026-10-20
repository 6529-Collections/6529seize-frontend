import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageIdentityHeaderCICRate from "@/components/user/identity/header/cic-rate/UserPageIdentityHeaderCICRate";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/i18n/locales";

jest.mock(
  "@/components/user/identity/header/cic-rate/UserPageIdentityHeaderCICRateStats",
  () => () => <div data-testid="stats" />
);
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: "0x1" }),
}));
jest.mock("@tanstack/react-query");
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
}));
jest.mock("react-use", () => ({ createBreakpoint: () => () => "MD" }));

const useQueryMock = useQuery as jest.Mock;
const useMutationMock = useMutation as jest.Mock;

describe.each([false, true])(
  "UserPageIdentityHeaderCICRate (tooltip: %s)",
  (isTooltip) => {
    beforeEach(() => {
      useQueryMock.mockReturnValue({
        data: { cic_rating_by_rater: 0, cic_ratings_left_to_give_by_rater: 5 },
      });
      useMutationMock.mockImplementation((opts: any) => ({
        mutateAsync: jest.fn(opts.mutationFn),
      }));
    });

    function setup(auth?: any, locale: SupportedLocale = DEFAULT_LOCALE) {
      const authValue = {
        requestAuth: jest.fn().mockResolvedValue({ success: true }),
        setToast: jest.fn(),
        connectedProfile: { handle: "alice" },
        activeProfileProxy: null,
        ...auth,
      } as any;
      const queryCtx = { onProfileCICModify: jest.fn() } as any;
      render(
        <AuthContext.Provider value={authValue}>
          <ReactQueryWrapperContext.Provider value={queryCtx}>
            <UserPageIdentityHeaderCICRate
              profile={{ query: "bob", handle: "bob" } as any}
              isTooltip={isTooltip}
              locale={locale}
            />
          </ReactQueryWrapperContext.Provider>
        </AuthContext.Provider>
      );
      return { authValue, queryCtx };
    }

    it.each(SUPPORTED_LOCALES)(
      "keeps its accessible label and action readable in %s",
      (locale) => {
        setup(undefined, locale);
        expect(
          screen.getByLabelText("Your total NIC Rating of bob:")
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: "Rate" })
        ).toBeDisabled();
      }
    );

    it("allows manual NIC entry without starting authentication or saving", async () => {
      const user = userEvent.setup();
      const { authValue } = setup();
      await user.clear(screen.getByLabelText(/Your total NIC Rating/));
      await user.type(screen.getByLabelText(/Your total NIC Rating/), "-1");
      expect(screen.getByLabelText(/Your total NIC Rating/)).toHaveValue("-1");
      expect(authValue.requestAuth).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Rate" })).toBeEnabled();
    });

    it("submits rating when authenticated", async () => {
      const user = userEvent.setup();
      const { authValue } = setup();
      await user.type(screen.getByLabelText(/Your total NIC Rating/), "3");
      await user.click(screen.getByRole("button", { name: "Rate" }));
      expect(authValue.requestAuth).toHaveBeenCalled();
    });

    it("shows toast when auth fails", async () => {
      const user = userEvent.setup();
      const { authValue } = setup({
        requestAuth: jest.fn().mockResolvedValue({ success: false }),
      });
      await user.type(screen.getByLabelText(/Your total NIC Rating/), "1");
      await user.click(screen.getByRole("button", { name: "Rate" }));
      expect(authValue.setToast).toHaveBeenCalled();
    });
  }
);
