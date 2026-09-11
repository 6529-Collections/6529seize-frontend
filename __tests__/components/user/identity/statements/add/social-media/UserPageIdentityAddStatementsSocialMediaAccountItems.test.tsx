import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  SOCIAL_MEDIA_ACCOUNT_STATEMENT_TYPES,
  STATEMENT_TYPE,
} from "@/helpers/Types";

let buttonProps: any[] = [];

jest.mock(
  "@/components/user/identity/statements/utils/UserPageIdentityAddStatementsTypeButton",
  () => ({
    __esModule: true,
    ADD_STATEMENT_PLATFORM_TOOLTIP_ID: "platform-tooltip",
    default: (props: any) => {
      buttonProps.push(props);
      return (
        <button data-testid={props.statementType} onClick={props.onClick} />
      );
    },
  })
);

jest.mock("@/hooks/useIsTouchDevice", () => () => false);
jest.mock("react-tooltip", () => ({ Tooltip: () => null }));

const Component =
  require("@/components/user/identity/statements/add/social-media/UserPageIdentityAddStatementsSocialMediaAccountItems").default;

describe("UserPageIdentityAddStatementsSocialMediaAccountItems", () => {
  beforeEach(() => {
    buttonProps = [];
  });

  it("renders buttons and handles click", async () => {
    const setType = jest.fn();
    render(<Component activeType={STATEMENT_TYPE.X} setSocialType={setType} />);
    expect(buttonProps).toHaveLength(
      SOCIAL_MEDIA_ACCOUNT_STATEMENT_TYPES.length
    );
    expect(screen.getByText("Choose a platform")).toHaveClass("tw-mb-2");
    const picker = screen.getByRole("group", { name: "Choose a platform" });
    const rows = Array.from(picker.querySelectorAll(":scope > span"));
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.querySelectorAll("button").length)).toEqual([
      7, 6,
    ]);
    expect(buttonProps[0]).toMatchObject({ isFirst: true, isLast: false });
    expect(buttonProps[6]).toMatchObject({ isFirst: false, isLast: true });
    expect(buttonProps[7]).toMatchObject({ isFirst: true, isLast: false });
    expect(buttonProps[12]).toMatchObject({ isFirst: false, isLast: true });
    await userEvent.click(screen.getByTestId(STATEMENT_TYPE.GITHUB));
    expect(setType).toHaveBeenCalledWith(STATEMENT_TYPE.GITHUB);
    await userEvent.click(screen.getByTestId(STATEMENT_TYPE.LINKTREE));
    expect(setType).toHaveBeenCalledWith(STATEMENT_TYPE.LINKTREE);
  });
});
