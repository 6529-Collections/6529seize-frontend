import GradientsPage from "@/app/6529-gradient/page";
import DisputeResolution from "@/app/dispute-resolution/page";
import PlansPage from "@/app/emma/plans/page";
import MemeLabCollectionPage from "@/app/meme-lab/collection/[collection]/page";
import NotFoundPage from "@/app/not-found";
import { AuthContext } from "@/components/auth/Auth";
import MemeLabCollection from "@/components/memelab/MemeLabCollection";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import React, { useMemo } from "react";

jest.mock("next/dynamic", () => () => {
  const MockDynamicComponent = () => <div data-testid="dynamic" />;
  MockDynamicComponent.displayName = "MockDynamicComponent";
  return MockDynamicComponent;
});
jest.mock("@/components/6529Gradient/6529Gradient", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="gradient" />),
}));
jest.mock("@/components/memelab/MemeLabCollection", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="meme-lab-collection" />),
}));
jest.mock(
  "@/components/distribution-plan-tool/wrapper/DistributionPlanToolWrapper",
  () =>
    function MockDistributionPlanToolWrapper({ children }: any) {
      return <div data-testid="wrapper">{children}</div>;
    }
);
jest.mock(
  "@/components/distribution-plan-tool/plans/DistributionPlanToolPlans",
  () =>
    function MockDistributionPlanToolPlans() {
      return <div data-testid="plans" />;
    }
);
jest.mock(
  "@/components/distribution-plan-tool/create-plan/DistributionPlanToolCreatePlan",
  () =>
    function MockDistributionPlanToolCreatePlan() {
      return <div data-testid="create" />;
    }
);
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const TestProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const setTitle = jest.fn();
  const authContextValue = useMemo(() => ({ setTitle }), [setTitle]);
  return (
    <AuthContext.Provider value={authContextValue as any}>
      {children}
    </AuthContext.Provider>
  );
};

// Mock TitleContext
jest.mock("@/contexts/TitleContext", () => ({
  useTitle: () => ({
    title: "Test Title",
    setTitle: jest.fn(),
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
    setStreamHasNewItems: jest.fn(),
  }),
  useSetTitle: jest.fn(),
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  useSetStreamHasNewItems: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("additional static pages", () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      back: jest.fn(),
      push: jest.fn(),
    });
  });
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });
  it("renders 404 not-found page with proper content and navigation", async () => {
    const routerMock = { back: jest.fn(), push: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(routerMock);
    const user = userEvent.setup();

    render(
      <TestProvider>
        <NotFoundPage />
      </TestProvider>
    );

    // Check for main error message
    expect(screen.getByText(/404 \| PAGE NOT FOUND/i)).toBeInTheDocument();

    // Check for navigation link
    const homeLink = screen.getByRole("link", { name: /6529 HOME/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute("href", "/");

    const backButton = screen.getByRole("button", {
      name: /back to previous page/i,
    });
    expect(backButton).toBeInTheDocument();

    await user.click(backButton);
    expect(routerMock.back).toHaveBeenCalledTimes(1);

    // Check for visual elements
    expect(screen.getByAltText("SummerGlasses")).toBeInTheDocument();
    expect(screen.getByAltText("sgt_flushed")).toBeInTheDocument();
  });

  it("renders dispute resolution page with legal content", () => {
    render(
      <TestProvider>
        <DisputeResolution />
      </TestProvider>
    );

    // Check for main heading
    expect(
      screen.getByRole("heading", { name: /dispute resolution/i })
    ).toBeInTheDocument();

    // Check for key legal content
    expect(
      screen.getByText(/JAMS, an arbitration organization/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Manhattan County/i)).toBeInTheDocument();

    // Check for back link to Terms of Service
    const backLink = screen.getByRole("link", {
      name: /back to terms of service/i,
    });
    expect(backLink).toBeInTheDocument();
  });

  it("renders gradients page with dynamic component", () => {
    render(
      <TestProvider>
        <GradientsPage />
      </TestProvider>
    );

    // Verify the gradient component is rendered
    expect(screen.getByTestId("gradient")).toBeInTheDocument();

    // Verify the page structure
    const mainElement = screen.getByRole("main");
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveClass("main");
  });

  it("renders EMMA plans page with distribution tool components", () => {
    render(
      <TestProvider>
        <PlansPage />
      </TestProvider>
    );

    // Check for main heading
    expect(screen.getByRole("heading", { name: /EMMA/i })).toBeInTheDocument();

    // Check for description
    expect(
      screen.getByText(/The Seize distribution plan tool/i)
    ).toBeInTheDocument();

    // Verify mocked components are rendered
    expect(screen.getByTestId("wrapper")).toBeInTheDocument();
    expect(screen.getByTestId("plans")).toBeInTheDocument();
    expect(screen.getByTestId("create")).toBeInTheDocument();
  });

  it("renders MemeLabCollection with properly formatted collectionName", async () => {
    const Page = await MemeLabCollectionPage({
      params: Promise.resolve({ collection: "test-collection" }),
    });

    render(Page);

    // Verify the component was called with the correct props
    const mockMemeLabCollection = MemeLabCollection as jest.Mock;
    expect(mockMemeLabCollection).toHaveBeenCalledTimes(1);

    // Check the first argument (props)
    const callArgs = mockMemeLabCollection.mock.calls[0];
    expect(callArgs[0]).toEqual({ collectionName: "test collection" });

    // Verify the mocked component renders
    expect(screen.getByTestId("meme-lab-collection")).toBeInTheDocument();

    // Verify the page structure
    const mainElement = screen.getByRole("main");
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveClass("main");
  });

  it("handles different collection name formats correctly", async () => {
    const Page = await MemeLabCollectionPage({
      params: Promise.resolve({ collection: "multi-word-collection-name" }),
    });

    render(Page);

    const mockMemeLabCollection = MemeLabCollection as jest.Mock;

    // Check the first argument (props)
    const callArgs = mockMemeLabCollection.mock.calls[0];
    expect(callArgs[0]).toEqual({
      collectionName: "multi word collection name",
    });
  });
});
