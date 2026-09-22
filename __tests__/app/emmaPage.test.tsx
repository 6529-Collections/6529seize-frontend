import DistributionPlanTool, { generateMetadata } from "@/app/emma/page";
import { publicEnv } from "@/config/env";
import { TitleProvider } from "@/contexts/TitleContext";
import { render, screen } from "@testing-library/react";

const domain = new URL(publicEnv.BASE_ENDPOINT).hostname;

jest.mock(
  "@/components/distribution-plan-tool/connect/distribution-plan-tool-connect",
  () => () => <div data-testid="connect" />
);
jest.mock(
  "@/components/distribution-plan-tool/wrapper/DistributionPlanToolWrapper",
  () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="wrapper">{children}</div>
    ),
  })
);

describe("EMMA page", () => {
  it("renders a compact entry without the introduction", async () => {
    render(
      <TitleProvider>
        {await DistributionPlanTool({ searchParams: Promise.resolve({}) })}
      </TitleProvider>
    );
    expect(screen.getByTestId("wrapper")).toBeInTheDocument();
    expect(screen.getByTestId("connect")).toBeInTheDocument();
    expect(screen.queryByText(/Meet EMMA/i)).not.toBeInTheDocument();
  });

  it("exports metadata", async () => {
    const metadata = await generateMetadata();
    expect(metadata.title).toBe("EMMA | Tools");
    expect(metadata.description).toBe(`Tools | ${domain}`);
  });
});
