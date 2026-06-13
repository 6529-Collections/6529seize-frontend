import { render, screen } from "@testing-library/react";
import { createElement } from "react";

import UserPageHeaderPfp from "@/components/user/user-page-header/pfp/UserPageHeaderPfp";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) =>
    createElement("img", { ...props, alt: props.alt ?? "" }),
}));

describe("UserPageHeaderPfp", () => {
  it("renders image when profile has pfp", () => {
    const { container } = render(
      <UserPageHeaderPfp
        profile={{ pfp: "url" } as any}
        profileLabel="Alice"
        defaultBanner1="#000"
        defaultBanner2="#fff"
      />
    );
    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img?.getAttribute("src")).toContain("url");
    expect(
      screen.getByRole("img", { name: "Alice's profile picture" })
    ).toBeInTheDocument();
  });

  it("renders placeholder when no pfp", () => {
    const { container } = render(
      <UserPageHeaderPfp
        profile={{} as any}
        profileLabel="Alice"
        defaultBanner1="#000"
        defaultBanner2="#fff"
      />
    );
    expect(container.querySelector("img")).toBeNull();
  });
});
