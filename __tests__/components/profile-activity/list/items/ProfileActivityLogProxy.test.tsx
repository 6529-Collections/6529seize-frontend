import { render, screen } from "@testing-library/react";
import React from "react";
import ProfileActivityLogProxy from "@/components/profile-activity/list/items/ProfileActivityLogProxy";
import { useSearchParams } from "next/navigation";

let linkProps: any;
jest.mock("@/components/user/utils/CommonProfileLink", () => (props: any) => {
  linkProps = props;
  return <div data-testid="link">{props.handleOrWallet}</div>;
});

jest.mock("next/navigation", () => ({ useSearchParams: jest.fn() }));

const log = { target_profile_handle: "bob" } as any;

describe("ProfileActivityLogProxy", () => {
  it("marks link as current user when handle matches", () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams({ user: "bob" })
    );
    render(<ProfileActivityLogProxy log={log} />);
    expect(screen.getByTestId("link")).toHaveTextContent("bob");
    expect(linkProps.isCurrentUser).toBe(true);
  });

  it("marks link as other user when handle differs", () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams({ user: "alice" })
    );
    render(<ProfileActivityLogProxy log={log} />);
    expect(linkProps.isCurrentUser).toBe(false);
  });
});
