import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import UserPageHeaderBanner from "@/components/user/user-page-header/banner/UserPageHeaderBanner";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

jest.mock("@/components/utils/icons/PencilIcon", () => () => (
  <span data-testid="pencil" />
));
jest.mock(
  "@/components/utils/animation/CommonAnimationWrapper",
  () =>
    ({ children }: any) => <div>{children}</div>
);
jest.mock(
  "@/components/utils/animation/CommonAnimationOpacity",
  () =>
    ({ children, onClicked }: any) => (
      <button data-testid="opacity" type="button" onClick={onClicked}>
        {children}
      </button>
    )
);

jest.mock(
  "@/components/user/user-page-header/banner/UserPageHeaderEditBanner",
  () => (props: any) => (
    <button data-testid="edit" type="button" onClick={props.onClose} />
  )
);

describe("UserPageHeaderBanner", () => {
  const baseProfile: ApiIdentity = {
    id: "1",
    handle: "alice",
    normalised_handle: null,
    pfp: null,
    cic: 0,
    rep: 0,
    level: 0,
    tdh: 0,
    consolidation_key: "",
    display: "alice",
    primary_wallet: "0xabc",
    banner1: null,
    banner2: null,
    classification: 0 as any,
    sub_classification: null,
  };

  it("opens and closes edit modal when button clicked", async () => {
    render(
      <UserPageHeaderBanner
        profile={baseProfile}
        defaultBanner1="#000"
        defaultBanner2="#fff"
        canEdit={true}
        profileLabel="alice"
      />
    );

    const editButton = screen.getByRole("button", {
      name: "Edit alice's profile banner",
    });
    expect(editButton).toHaveClass("tw-hidden", "sm:tw-block");
    expect(editButton.firstElementChild).toHaveClass(
      "tw-opacity-0",
      "desktop-hover:group-hover:tw-opacity-100",
      "touch-only:tw-opacity-100",
      "touch-only:tw-bg-transparent"
    );
    expect(editButton.querySelector('[aria-hidden="true"]')).toHaveClass(
      "touch-only:tw-size-9",
      "touch-only:tw-bg-iron-950"
    );

    await userEvent.click(editButton);
    expect(screen.getByTestId("edit")).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("edit"));
    expect(screen.queryByTestId("edit")).toBeNull();
  });

  it("hides edit button when cannot edit", () => {
    render(
      <UserPageHeaderBanner
        profile={baseProfile}
        defaultBanner1="#000"
        defaultBanner2="#fff"
        canEdit={false}
        profileLabel="alice"
      />
    );

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("keeps mobile artwork full strength under the shared bottom fade", () => {
    const { container } = render(
      <UserPageHeaderBanner
        profile={{
          ...baseProfile,
          banner1: "https://example.com/banner.jpg",
        }}
        defaultBanner1="#000"
        defaultBanner2="#fff"
        canEdit={false}
        profileLabel="alice"
      />
    );

    const imageLayer = container.querySelector<HTMLElement>(
      'div[style*="background-image"]'
    );
    expect(imageLayer).toHaveClass("md:tw-opacity-80");
    expect(imageLayer).not.toHaveClass("tw-mix-blend-lighten");
    expect(imageLayer).not.toHaveClass("tw-opacity-80");

    expect(
      container.querySelector<HTMLElement>('div[class~="tw-ring-white/5"]')
    ).toHaveClass("md:tw-hidden");
    expect(
      container.querySelector<HTMLElement>('div[class~="tw-bg-gradient-to-t"]')
    ).not.toHaveClass("tw-hidden", "md:tw-block");
    expect(
      container.querySelector<HTMLElement>('div[class~="tw-bg-gradient-to-b"]')
    ).toHaveClass("tw-hidden", "md:tw-block");
  });

  it("keeps the gradient fallback full strength under the shared bottom fade", () => {
    const { container } = render(
      <UserPageHeaderBanner
        profile={baseProfile}
        defaultBanner1="#000"
        defaultBanner2="#fff"
        canEdit={false}
        profileLabel="alice"
      />
    );

    const gradientLayer = container.querySelector<HTMLElement>(
      'div[style*="linear-gradient"]'
    );
    expect(gradientLayer).toHaveAttribute(
      "style",
      "background: linear-gradient(45deg, #000 0%, #fff 100%);"
    );
    expect(gradientLayer).not.toHaveClass("tw-mix-blend-lighten");
    expect(gradientLayer).not.toHaveClass("tw-opacity-60");
    expect(
      container.querySelector<HTMLElement>('div[class~="tw-ring-white/5"]')
    ).toHaveClass("md:tw-hidden");
    expect(
      container.querySelector<HTMLElement>('div[class~="tw-bg-gradient-to-t"]')
    ).not.toHaveClass("tw-hidden", "md:tw-block");
    expect(
      container.querySelector<HTMLElement>('div[class~="tw-bg-gradient-to-b"]')
    ).toHaveClass("tw-hidden", "md:tw-block");
  });
});
