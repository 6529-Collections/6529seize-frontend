import { render } from "@testing-library/react";

const NextGenAdminPage = require("@/app/nextgen/manager/page").default;

jest.mock("@/components/nextGen/admin/NextGenAdmin", () => () => (
  <div data-testid="admin" />
));

jest.mock("@/contexts/TitleContext", () => ({
  useSetTitle: jest.fn(),
}));

describe("NextGen admin page", () => {
  it("renders admin component", () => {
    render(<NextGenAdminPage />);
  });
});
