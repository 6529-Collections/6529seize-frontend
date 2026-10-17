import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { useInitialEnvironmentOrigin } from "@/components/common/EnvironmentOriginContext";
import RootClientShell from "@/components/providers/RootClientShell";

const mockProvidersProps = jest.fn();

jest.mock("@/components/providers/RuntimeFavicon", () => ({
  __esModule: true,
  default: () => <span data-testid="runtime-favicon" />,
}));

jest.mock("@/components/monitoring/MobileLaunchTimingReporter", () => ({
  __esModule: true,
  default: () => <span data-testid="launch-timing" />,
}));

jest.mock("@/components/monitoring/AwsRumProvider", () => ({
  __esModule: true,
  default: ({ children }: { readonly children: ReactNode }) => (
    <div data-testid="aws-rum">{children}</div>
  ),
}));

jest.mock("@/components/providers/Providers", () => ({
  __esModule: true,
  default: ({
    children,
    ...props
  }: {
    readonly children: ReactNode;
    readonly initialIsIos?: boolean;
    readonly initialEulaConsentVersion?: string;
  }) => {
    mockProvidersProps(props);
    return <div data-testid="providers">{children}</div>;
  },
}));

jest.mock("@/components/dynamic-head/DynamicHeadTitle", () => ({
  __esModule: true,
  default: () => <span data-testid="head-title" />,
}));

jest.mock("@/components/providers/LayoutWrapper", () => ({
  __esModule: true,
  default: ({ children }: { readonly children: ReactNode }) => (
    <div data-testid="layout-wrapper">{children}</div>
  ),
}));

function OriginProbe() {
  return <p>{useInitialEnvironmentOrigin()}</p>;
}

it("renders the root client tree with the request values from the layout", () => {
  render(
    <RootClientShell
      origin="https://staging.6529.io"
      initialIsIos
      initialEulaConsentVersion="2026-10"
    >
      <OriginProbe />
    </RootClientShell>
  );

  expect(screen.getByTestId("runtime-favicon")).toBeInTheDocument();
  expect(screen.getByTestId("launch-timing")).toBeInTheDocument();
  expect(mockProvidersProps).toHaveBeenCalledWith({
    initialIsIos: true,
    initialEulaConsentVersion: "2026-10",
  });

  const providers = screen.getByTestId("providers");
  expect(screen.getByTestId("aws-rum")).toContainElement(providers);
  expect(providers.firstElementChild).toBe(screen.getByTestId("head-title"));
  expect(screen.getByTestId("layout-wrapper")).toContainElement(
    screen.getByText("https://staging.6529.io")
  );
});
