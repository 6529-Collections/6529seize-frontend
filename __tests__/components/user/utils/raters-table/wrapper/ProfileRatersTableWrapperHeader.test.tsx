import ProfileRatersTableWrapperHeader from "@/components/user/utils/raters-table/wrapper/ProfileRatersTableWrapperHeader";
import { ProfileRatersTableType } from "@/enums";
import { render, screen } from "@testing-library/react";

jest.mock("@/components/user/utils/UserTableHeaderWrapper", () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="wrapper">{children}</div>,
}));

jest.mock("@/components/profile-activity/ProfileName", () => ({
  __esModule: true,
  default: () => <span data-testid="name" />,
  ProfileNameType: { DEFAULT: "DEFAULT" },
}));

describe("ProfileRatersTableWrapperHeader", () => {
  it("renders CIC received text", () => {
    render(
      <ProfileRatersTableWrapperHeader
        type={ProfileRatersTableType.CIC_RECEIVED}
      />
    );
    expect(screen.getByTestId("wrapper").textContent).toContain(
      "Who's NIC-Rating"
    );
    expect(screen.getByTestId("name")).toBeInTheDocument();
  });

  it("renders REP given text", () => {
    render(
      <ProfileRatersTableWrapperHeader
        type={ProfileRatersTableType.REP_GIVEN}
      />
    );
    expect(screen.getByTestId("wrapper").textContent).toContain("Who's ");
    expect(screen.getByTestId("wrapper").textContent).toContain("Repping");
  });
});
