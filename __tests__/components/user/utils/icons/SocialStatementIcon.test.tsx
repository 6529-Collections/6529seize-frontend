import { render, screen } from "@testing-library/react";
import React from "react";
import SocialStatementIcon from "@/components/user/utils/icons/SocialStatementIcon";
import { STATEMENT_TYPE } from "@/helpers/Types";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";

jest.mock("@/helpers/AllowlistToolHelpers", () => ({
  assertUnreachable: jest.fn(),
}));

jest.mock("@/components/user/utils/icons/XIcon", () => () => (
  <div data-testid="X" />
));
jest.mock("@/components/user/utils/icons/DiscordIcon", () => () => (
  <div data-testid="DISCORD" />
));
jest.mock("@/components/user/utils/icons/WebsiteIcon", () => () => (
  <div data-testid="WEBSITE" />
));
jest.mock("@/components/user/utils/icons/ManifoldIcon", () => () => (
  <div data-testid="MANIFOLD" />
));
jest.mock("@/components/user/utils/icons/TransientIcon", () => () => (
  <div data-testid="TRANSIENT" />
));

// other icons default to simple spans
jest.mock("@/components/user/utils/icons/FacebookIcon", () => () => <div />);

describe("SocialStatementIcon", () => {
  it("renders X icon for STATEMENT_TYPE.X", () => {
    render(<SocialStatementIcon statementType={STATEMENT_TYPE.X} />);
    expect(screen.getByTestId("X")).toBeInTheDocument();
  });

  it("renders Discord icon for STATEMENT_TYPE.DISCORD", () => {
    render(<SocialStatementIcon statementType={STATEMENT_TYPE.DISCORD} />);
    expect(screen.getByTestId("DISCORD")).toBeInTheDocument();
  });

  it("renders Website icon for STATEMENT_TYPE.WEBSITE", () => {
    render(<SocialStatementIcon statementType={STATEMENT_TYPE.WEBSITE} />);
    expect(screen.getByTestId("WEBSITE")).toBeInTheDocument();
  });

  it("renders Manifold icon for STATEMENT_TYPE.MANIFOLD", () => {
    render(<SocialStatementIcon statementType={STATEMENT_TYPE.MANIFOLD} />);
    expect(screen.getByTestId("MANIFOLD")).toBeInTheDocument();
  });

  it("renders Transient icon for STATEMENT_TYPE.TRANSIENT", () => {
    render(<SocialStatementIcon statementType={STATEMENT_TYPE.TRANSIENT} />);
    expect(screen.getByTestId("TRANSIENT")).toBeInTheDocument();
  });

  it("calls assertUnreachable for unknown type", () => {
    render(<SocialStatementIcon statementType={"UNKNOWN" as any} />);
    expect(assertUnreachable).toHaveBeenCalledWith("UNKNOWN");
  });

  it("handles every statement type without calling assertUnreachable", () => {
    jest.clearAllMocks();
    for (const type of Object.values(STATEMENT_TYPE)) {
      const { unmount } = render(<SocialStatementIcon statementType={type} />);
      unmount();
    }
    expect(assertUnreachable).not.toHaveBeenCalled();
  });
});
