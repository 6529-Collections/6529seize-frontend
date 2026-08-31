import { render, screen } from "@testing-library/react";
import SocialStatementIcon from "@/components/user/utils/icons/SocialStatementIcon";
import { STATEMENT_TYPE } from "@/helpers/Types";

jest.mock("@/components/user/utils/icons/XIcon", () => () => (
  <span data-testid="x" />
));
jest.mock("@/components/user/utils/icons/DiscordIcon", () => () => (
  <span data-testid="discord" />
));

describe("SocialStatementIcon", () => {
  it("renders correct icon by statement type", () => {
    render(<SocialStatementIcon statementType={STATEMENT_TYPE.X} />);
    expect(screen.getByTestId("x")).toBeInTheDocument();

    render(<SocialStatementIcon statementType={STATEMENT_TYPE.DISCORD} />);
    expect(screen.getByTestId("discord")).toBeInTheDocument();
  });

  it("uses a generic link icon for an unknown type", () => {
    expect(() =>
      render(<SocialStatementIcon statementType="BAD" />)
    ).not.toThrow();
  });
});
