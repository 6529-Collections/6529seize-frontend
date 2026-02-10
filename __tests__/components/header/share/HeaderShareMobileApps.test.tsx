import { ShareMobileApp } from "@/components/header/share/HeaderShareMobileApps";
import { MOBILE_APP_ANDROID, MOBILE_APP_IOS } from "@/constants/constants";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, target, onClick, className }: any) => (
    <a
      href={href}
      target={target}
      onClick={onClick}
      className={className}
      data-testid="link"
    >
      {children}
    </a>
  ),
}));

describe("ShareMobileApp", () => {
  it("renders iOS link with default target", () => {
    render(<ShareMobileApp platform="ios" />);
    const link = screen.getByTestId("link");
    expect(link).toHaveAttribute("href", MOBILE_APP_IOS);
    expect(link).toHaveAttribute("target", "_blank");
    const img = link.querySelector("img")!;
    expect(img).toHaveAttribute("src", "/app-store.png");
    expect(img).toHaveAttribute("alt", "6529 Mobile iOS");
  });

  it("redirects at top level when target is _self", () => {
    const top = { location: { href: "" } };
    Object.defineProperty(window, "top", { value: top });
    render(<ShareMobileApp platform="android" target="_self" />);
    const link = screen.getByTestId("link");
    fireEvent.click(link);
    expect(top.location.href).toBe(MOBILE_APP_ANDROID);
  });
});
