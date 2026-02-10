import DistributionPlanTool, { generateMetadata } from "@/app/emma/page";
import { TitleProvider } from "@/contexts/TitleContext";
import { render, screen } from "@testing-library/react";

jest.mock(
  "@/components/distribution-plan-tool/connect/distribution-plan-tool-connect",
  () => () => <div data-testid="connect" />
);
jest.mock(
  "@/components/distribution-plan-tool/wrapper/DistributionPlanToolWrapper",
  () => ({
    __esModule: true,
    default: ({ children }: any) => <div data-testid="wrapper">{children}</div>,
  })
);

describe("EMMA page", () => {
  it("renders wrapper and connect components", () => {
    render(
      <TitleProvider>
        <DistributionPlanTool />
      </TitleProvider>
    );
    expect(screen.getByTestId("wrapper")).toBeInTheDocument();
    expect(screen.getByTestId("connect")).toBeInTheDocument();
    expect(screen.getByText(/Meet EMMA/i)).toBeInTheDocument();
  });

  it("exports metadata", async () => {
    const metadata = await generateMetadata();
    expect(metadata.title).toBe("EMMA");
    expect(metadata.description).toBe("Tools | 6529.io");
  });
});
