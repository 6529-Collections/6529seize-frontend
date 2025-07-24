import React from "react";
import { render, screen } from "@testing-library/react";
import ProfileActivityLogProxyActionChange from "@/components/profile-activity/list/items/ProfileActivityLogProxyActionChange";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";

jest.mock("@/components/user/utils/CommonProfileLink", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="link" />),
}));
jest.mock("next/navigation", () => ({ useSearchParams: jest.fn() }));

const {
  default: CommonProfileLink,
} = require("@/components/user/utils/CommonProfileLink");
const { useSearchParams } = require("next/navigation");

beforeEach(() => {
  (CommonProfileLink as jest.Mock).mockClear();
});

test("displays end time change with formatted date", () => {
  (useSearchParams as jest.Mock).mockReturnValue(
    new URLSearchParams({ user: "bob" })
  );
  const log: any = {
    target_profile_handle: "Bob",
    contents: { type: ApiProfileProxyActionType.AllocateRep, end_time: 0 },
  };
  render(<ProfileActivityLogProxyActionChange log={log} />);
  expect(screen.getByText("Allocate Rep")).toBeInTheDocument();
  expect(screen.getByText("end time to")).toBeInTheDocument();
  expect(screen.getByText("indefinite")).toBeInTheDocument();
  expect((CommonProfileLink as jest.Mock).mock.calls[0][0].isCurrentUser).toBe(
    true
  );
});

test("displays credit amount change", () => {
  (useSearchParams as jest.Mock).mockReturnValue(
    new URLSearchParams({ user: "" })
  );
  const log: any = {
    target_profile_handle: "Carol",
    contents: {
      type: ApiProfileProxyActionType.AllocateCic,
      credit_amount: 1000,
    },
  };
  render(<ProfileActivityLogProxyActionChange log={log} />);
  expect(screen.getByText("credit amount to")).toBeInTheDocument();
  expect(screen.getByText("1,000")).toBeInTheDocument();
});
