import CommunityStatsPage, { generateMetadata } from "@/app/network/page";
import { AuthContext } from "@/components/auth/Auth";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { groupSlice } from "@/store/groupSlice";
import { configureStore } from "@reduxjs/toolkit";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";

// ✅ Mocks
jest.mock("react-bootstrap", () => ({
  Container: ({ children, fluid, className }: any) => (
    <div data-testid="container" className={className} data-fluid={fluid}>
      {children}
    </div>
  ),
  Row: ({ children }: any) => <div data-testid="row">{children}</div>,
  Col: ({ children }: any) => <div data-testid="col">{children}</div>,
}));
jest.mock("@/styles/Home.module.scss", () => ({
  main: "main-class",
  tdhMain: "tdh-main-class",
}));
jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock("@/hooks/useDeviceInfo");
jest.mock("@/components/community/CommunityMembers", () => ({
  __esModule: true,
  default: () => <div data-testid="community-members" />,
}));

// ✅ TitleContext
jest.mock("@/contexts/TitleContext", () => ({
  useTitle: () => ({
    title: "Test Title",
    setTitle: jest.fn(),
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
  }),
  useSetTitle: jest.fn(),
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@/services/6529api", () => ({
  fetchUrl: jest.fn(() => Promise.resolve({ data: [{ mock: "item" }] })),
}));

describe("CommunityStats page", () => {
  const useDeviceInfoMock = useDeviceInfo as jest.MockedFunction<
    typeof useDeviceInfo
  >;
  const createTestStore = () =>
    configureStore({
      reducer: {
        group: groupSlice.reducer,
      },
    });

  beforeEach(() => {
    useDeviceInfoMock.mockReturnValue({
      isApp: false,
      isMobileDevice: false,
      hasTouchScreen: false,
    });
  });

  const renderPage = () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <AuthContext.Provider value={{} as any}>
          <CommunityStatsPage />
        </AuthContext.Provider>
      </Provider>
    );
  };

  it("renders layout and dynamic component", async () => {
    renderPage();
    expect(await screen.findByTestId("community-members")).toBeInTheDocument();
    expect(document.querySelector("main")).toHaveClass("tailwind-scope");
  });

  it("renders consistently on mount", async () => {
    renderPage();
    expect(await screen.findByTestId("community-members")).toBeInTheDocument();
  });

  it("generates metadata", async () => {
    const metadata = await generateMetadata();
    expect(metadata.title).toEqual("Network");
    expect(metadata.description).toEqual("Network | 6529.io");
  });
});
