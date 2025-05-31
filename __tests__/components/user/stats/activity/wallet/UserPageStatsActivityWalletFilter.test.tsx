import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPageStatsActivityWalletFilter from "../../../../../../components/user/stats/activity/wallet/filter/UserPageStatsActivityWalletFilter";
import { UserPageStatsActivityWalletFilterType } from "../../../../../../components/user/stats/activity/wallet/UserPageStatsActivityWallet";

jest.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: any) => <>{children}</>,
  motion: { div: ({ children }: any) => <div>{children}</div> },
  useAnimate: () => [ { current: null }, jest.fn() ],
}));

jest.mock("react-use", () => ({
  useClickAway: jest.fn(),
  useKeyPressEvent: jest.fn(),
  useCss: jest.fn(() => ["", jest.fn()]),
}));

jest.mock("../../../../../../components/user/stats/activity/wallet/filter/UserPageStatsActivityWalletFilterItem", () => (props: any) => (
  <li data-testid="filter-item" onClick={() => props.onFilter(props.filter)}>{props.title}</li>
));

describe("UserPageStatsActivityWalletFilter", () => {
  it("opens list and selects filter", async () => {
    const user = userEvent.setup();
    const setActive = jest.fn();
    render(
      <UserPageStatsActivityWalletFilter
        activeFilter={UserPageStatsActivityWalletFilterType.ALL}
        setActiveFilter={setActive}
      />
    );
    await user.click(screen.getByRole("button"));
    const option = screen.getAllByTestId("filter-item")[1];
    await user.click(option);
    expect(setActive).toHaveBeenCalledWith(Object.values(UserPageStatsActivityWalletFilterType)[1]);
  });
});
